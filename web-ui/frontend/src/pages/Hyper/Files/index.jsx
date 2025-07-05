import React, { useState, useEffect, useRef } from 'react';

// 服务器URL配置
import { SERVER_URL } from '../../../utils/index'

const DocumentManager = () => {
  const [files, setFiles] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState(new Set());
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isEmbedding, setIsEmbedding] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [embeddingProgress, setEmbeddingProgress] = useState({});
  const [notification, setNotification] = useState(null);
  const [progressDetails, setProgressDetails] = useState({});
  const [logs, setLogs] = useState([]);
  const [showLogs, setShowLogs] = useState(false);
  const fileInputRef = useRef(null);
  const wsRef = useRef(null);
  const logsEndRef = useRef(null);

  // 获取已上传的文件列表
  useEffect(() => {
    fetchFiles();
    connectWebSocket();

    // 清理函数
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  // 建立WebSocket连接
  const connectWebSocket = () => {
    try {
      const wsUrl = SERVER_URL.replace('http', 'ws') + '/ws';
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log('WebSocket连接已建立');
      };

      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleProgressUpdate(data);
        } catch (error) {
          console.error('解析WebSocket消息失败:', error);
        }
      };

      wsRef.current.onclose = () => {
        console.log('WebSocket连接已关闭');
        // 3秒后尝试重连
        setTimeout(connectWebSocket, 3000);
      };

      wsRef.current.onerror = (error) => {
        console.error('WebSocket错误:', error);
      };
    } catch (error) {
      console.error('WebSocket连接失败:', error);
    }
  };

  // 处理进度更新
  const handleProgressUpdate = (data) => {
    switch (data.type) {
      case 'progress':
        setEmbeddingProgress(prev => ({
          ...prev,
          current: data.current,
          total: data.total,
          percentage: data.percentage,
          message: data.message
        }));
        break;

      case 'file_processing':
        setProgressDetails(prev => ({
          ...prev,
          [data.file_id]: {
            filename: data.filename,
            stage: data.stage,
            message: data.message
          }
        }));
        break;

      case 'file_completed':
        setProgressDetails(prev => {
          const updated = { ...prev };
          delete updated[data.file_id];
          return updated;
        });
        // 更新文件列表中的状态
        setFiles(prev => prev.map(file =>
          file.file_id === data.file_id
            ? { ...file, status: 'embedded' }
            : file
        ));
        break;

      case 'file_error':
        setProgressDetails(prev => ({
          ...prev,
          [data.file_id]: {
            error: data.error,
            message: `错误: ${data.error}`
          }
        }));
        // 更新文件列表中的状态
        setFiles(prev => prev.map(file =>
          file.file_id === data.file_id
            ? { ...file, status: 'error' }
            : file
        ));
        break;

      case 'all_completed':
        setIsEmbedding(false);
        setEmbeddingProgress({});
        setProgressDetails({});
        setSelectedFiles(new Set());
        showNotification('所有文档嵌入完成', 'success');
        fetchFiles(); // 刷新文件列表
        break;

      case 'error':
        setIsEmbedding(false);
        setEmbeddingProgress({});
        setProgressDetails({});
        showNotification(data.error, 'error');
        break;

      case 'log': {
        // 处理日志消息
        const logEntry = {
          id: Date.now() + Math.random(),
          timestamp: new Date(data.timestamp * 1000).toLocaleTimeString(),
          level: data.level,
          message: data.message
        };
        setLogs(prev => [...prev.slice(-49), logEntry]); // 保留最近50条日志
        // 自动滚动到底部
        setTimeout(() => {
          logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
        break;
      }

      default:
        break;
    }
  };

  const fetchFiles = async () => {
    try {
      const response = await fetch(`${SERVER_URL}/files`);
      const data = await response.json();
      setFiles(data.files || []);
    } catch (error) {
      showNotification('获取文件列表失败', 'error');
    }
  };

  const showNotification = (message, type = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleFileSelect = (event) => {
    const selectedFiles = Array.from(event.target.files);
    uploadFiles(selectedFiles);
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (event) => {
    event.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragging(false);
    const droppedFiles = Array.from(event.dataTransfer.files);
    uploadFiles(droppedFiles);
  };

  const uploadFiles = async (filesToUpload) => {
    if (filesToUpload.length === 0) return;

    setIsUploading(true);
    const formData = new FormData();

    filesToUpload.forEach(file => {
      formData.append('files', file);
    });

    try {
      const response = await fetch(`${SERVER_URL}/files/upload`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.files) {
        const successCount = data.files.filter(f => f.status === 'uploaded').length;
        const errorCount = data.files.filter(f => f.status === 'error').length;

        if (successCount > 0) {
          showNotification(`成功上传 ${successCount} 个文件`, 'success');
          fetchFiles();
        }

        if (errorCount > 0) {
          showNotification(`${errorCount} 个文件上传失败`, 'error');
        }
      }
    } catch (error) {
      showNotification('文件上传失败', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileSelection = (fileId) => {
    const newSelection = new Set(selectedFiles);
    if (newSelection.has(fileId)) {
      newSelection.delete(fileId);
    } else {
      newSelection.add(fileId);
    }
    setSelectedFiles(newSelection);
  };

  const handleSelectAll = () => {
    if (selectedFiles.size === files.length) {
      setSelectedFiles(new Set());
    } else {
      setSelectedFiles(new Set(files.map(f => f.file_id)));
    }
  };

  const handleEmbedDocuments = async () => {
    if (selectedFiles.size === 0) {
      showNotification('请先选择要嵌入的文档', 'warning');
      return;
    }

    setIsEmbedding(true);
    setEmbeddingProgress({});
    setProgressDetails({});
    setLogs([]); // 清空之前的日志
    setShowLogs(true); // 显示日志面板

    try {
      const response = await fetch(`${SERVER_URL}/files/embed-with-progress`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          file_ids: Array.from(selectedFiles),
          chunk_size: 1000,
          chunk_overlap: 200
        }),
      });

      const data = await response.json();

      if (data.processing) {
        showNotification(`开始处理 ${data.total_files} 个文档`, 'info');
        // 嵌入状态和进度将通过WebSocket更新
      } else {
        setIsEmbedding(false);
        showNotification('处理失败', 'error');
      }
    } catch (error) {
      setIsEmbedding(false);
      showNotification('文档嵌入失败', 'error');
    }
  };

  const handleDeleteFile = async (fileId) => {
    try {
      const response = await fetch(`${SERVER_URL}/files/${fileId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        showNotification('文件删除成功', 'success');
        fetchFiles();
        setSelectedFiles(prev => {
          const newSet = new Set(prev);
          newSet.delete(fileId);
          return newSet;
        });
      }
    } catch (error) {
      showNotification('文件删除失败', 'error');
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('zh-CN');
  };

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto">

        {/* 通知组件 */}
        {notification && (
          <div className={`fixed top-10 right-4 z-50 p-4 rounded-lg shadow-lg transition-all duration-300 ${notification.type === 'success' ? 'bg-green-500 text-white' :
            notification.type === 'error' ? 'bg-red-500 text-white' :
              notification.type === 'warning' ? 'bg-yellow-500 text-white' :
                'bg-blue-500 text-white'
            }`}>
            {notification.message}
          </div>
        )}

        {/* 文件上传区域 */}
        <div className="bg-white rounded-xl p-6 mb-8">
          <div className="text-2xl font-semibold text-gray-900 mb-4">上传文档</div>

          <div
            className={`border-3 border-dashed rounded-xl p-2 text-center transition-all duration-300 ${isDragging
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
              }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileSelect}
              className="hidden"
              accept=".txt,.pdf,.docx,.md"
            />

            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              {isDragging ? '释放文件以上传' : '点击或拖拽文件到此处'}
            </h3>
            <p className="text-gray-500 mb-4">
              支持 TXT、PDF、DOCX、MD 等格式
            </p>

            {isUploading && (
              <div className="flex items-center justify-center space-x-2">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                <span className="text-blue-600">上传中...</span>
              </div>
            )}
          </div>
        </div>

        {/* 文件列表和操作区域 */}
        <div className="bg-white rounded-xl p-6">
          <div className="flex justify-between items-center mb-6">
            <div className="text-2xl font-semibold text-gray-900">文档列表</div>
            <div className="flex space-x-3">
              <button
                onClick={handleSelectAll}
                className="px-4 py-2 text-sm border-0 font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                {selectedFiles.size === files.length ? '取消全选' : '全选'}
              </button>
              <button
                onClick={handleEmbedDocuments}
                disabled={selectedFiles.size === 0 || isEmbedding}
                className={`border-0 px-6 py-2 text-sm font-medium rounded-lg transition-all ${selectedFiles.size === 0 || isEmbedding
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl'
                  }`}
              >
                {isEmbedding ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>处理中...</span>
                  </div>
                ) : (
                  `嵌入选中文档 (${selectedFiles.size})`
                )}
              </button>
              {isEmbedding && (
                <button
                  onClick={() => {
                    setIsEmbedding(false);
                    setEmbeddingProgress({});
                    setProgressDetails({});
                    showNotification('处理已取消', 'warning');
                  }}
                  className="border-0 px-4 py-2 text-sm font-medium rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors"
                >
                  取消处理
                </button>
              )}
            </div>
          </div>

          {files.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl text-gray-300 mb-4">📄</div>
              <p className="text-gray-500">暂无文档，请先上传文档</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">选择</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">文件名</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">数据库</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">大小</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">上传时间</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">状态</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {files.map((file) => (
                    <tr key={file.file_id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4">
                        <input
                          type="checkbox"
                          checked={selectedFiles.has(file.file_id)}
                          onChange={() => handleFileSelection(file.file_id)}
                          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                        />
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-3">
                          <span className="font-medium text-gray-900">{file.filename}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                          {file.database_name || 'default'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-600">{formatFileSize(file.file_size)}</td>
                      <td className="py-3 px-4 text-gray-600">{formatDate(file.upload_time)}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${file.status === 'uploaded' ? 'bg-green-100 text-green-800' :
                          file.status === 'embedded' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                          {file.status === 'uploaded' ? '已上传' :
                            file.status === 'embedded' ? '已嵌入' : file.status}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => handleDeleteFile(file.file_id)}
                          className="text-red-600 hover:text-red-800 font-medium text-sm transition-colors"
                        >
                          删除
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* 进度显示面板 */}
        {null && (
          <div className="bg-white rounded-xl shadow-lg p-6 mt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">文档处理进度</h3>

            {/* 总体进度条 */}
            {embeddingProgress.total && (
              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">总体进度</span>
                  <span className="text-sm text-gray-500">
                    {embeddingProgress.current || 0}/{embeddingProgress.total}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                    style={{ width: `${embeddingProgress.percentage || 0}%` }}
                  ></div>
                </div>
                <p className="text-sm text-gray-600 mt-2">{embeddingProgress.message}</p>
              </div>
            )}

            {/* 详细进度信息 */}
            {/* {Object.keys(progressDetails).length > 0 && (
              <div className="space-y-3">
                <h4 className="text-md font-medium text-gray-800">处理详情</h4>
                {Object.entries(progressDetails).map(([fileId, details]) => (
                  <div key={fileId} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        {details.stage === 'reading' && (
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
                        )}
                        {details.stage === 'embedding' && (
                          <div className="animate-pulse rounded-full h-5 w-5 bg-blue-500"></div>
                        )}
                        {details.error && (
                          <div className="rounded-full h-5 w-5 bg-red-500 flex items-center justify-center">
                            <span className="text-white text-xs">!</span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <p className="text-sm font-medium text-gray-900">{details.filename}</p>
                          {details.database_name && (
                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                              {details.database_name}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">{details.message}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )} */}
          </div>
        )}

        {/* 日志显示面板 */}
        {(isEmbedding || showLogs) && logs.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6 mt-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">处理日志</h3>
              <div className="flex space-x-2">
                <button
                  onClick={() => setLogs([])}
                  className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  清空日志
                </button>
                <button
                  onClick={() => setShowLogs(!showLogs)}
                  className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  {showLogs ? '隐藏日志' : '显示日志'}
                </button>
              </div>
            </div>

            {showLogs && (
              <div className="bg-gray-900 rounded-lg p-4 h-80 overflow-y-auto font-mono text-sm">
                {logs.map((log) => (
                  <div key={log.id} className="flex space-x-3 mb-1">
                    <span className="text-white break-all">{log.message}</span>
                  </div>
                ))}
                <div ref={logsEndRef} />
              </div>
            )}
          </div>
        )}

        {/* 嵌入配置面板 */}
        {selectedFiles.size > 0 && !isEmbedding && (
          <div className="bg-white rounded-xl shadow-lg p-6 mt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">嵌入设置</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">分块大小</label>
                <input
                  type="number"
                  defaultValue={1000}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">重叠长度</label>
                <input
                  type="number"
                  defaultValue={200}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentManager;

