import React, { useState, useEffect } from 'react'
import { observer } from 'mobx-react'
import ReactMarkdown from 'react-markdown'
import { 
    MessageCircle,
    Send,
    Plus,
    Database,
    Settings,
    User,
    Bot,
    Trash2,
    RotateCcw,
    Loader2,
    Zap,
    Layers,
    BookOpen
} from 'lucide-react'
import {
    Button,
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
    ScrollArea,
    Textarea,
    Separator,
    Avatar,
    AvatarFallback,
    AvatarImage
} from '../../components/ui'
import { storeGlobalUser } from '../../store/globalUser'
import { SERVER_URL } from '../../utils'
import DatabaseSelector from '../../components/DatabaseSelector'

const HyperRAGHome = () => {
    // State
    const [conversations, setConversations] = useState([])
    const [activeConversationId, setActiveConversationId] = useState('')
    const [inputValue, setInputValue] = useState('')
    const [queryMode, setQueryMode] = useState('hyper')
    const [isLoading, setIsLoading] = useState(false)

    // Storage keys
  const STORAGE_KEYS = {
      CONVERSATIONS: 'hyperrag_conversations_v2',
      ACTIVE_ID: 'hyperrag_active_conversation_v2'
  }

    // Utility functions
    const saveToStorage = () => {
        localStorage.setItem(STORAGE_KEYS.CONVERSATIONS, JSON.stringify(conversations))
        localStorage.setItem(STORAGE_KEYS.ACTIVE_ID, activeConversationId)
  }

    const loadFromStorage = () => {
    try {
        const savedConversations = localStorage.getItem(STORAGE_KEYS.CONVERSATIONS)
        const savedActiveId = localStorage.getItem(STORAGE_KEYS.ACTIVE_ID)

        if (savedConversations) {
            const parsed = JSON.parse(savedConversations)
            setConversations(parsed)

            if (savedActiveId && parsed.find((c) => c.id === savedActiveId)) {
                setActiveConversationId(savedActiveId)
            } else if (parsed.length > 0) {
                setActiveConversationId(parsed[0].id)
            }
        } else {
            // Create default conversation
            const defaultConv = {
                id: 'default',
                title: 'Chat 1',
                messages: [],
                createdAt: new Date()
            }
            setConversations([defaultConv])
            setActiveConversationId('default')
        }
    } catch (error) {
        console.error('Failed to load from storage:', error)
    }
  }

    const createNewConversation = () => {
        const newConv = {
            id: Date.now().toString(),
            title: `Chat ${new Date().toLocaleTimeString()}`,
            messages: [],
            createdAt: new Date()
        }
        setConversations(prev => [newConv, ...prev])
        setActiveConversationId(newConv.id)
  }

    const deleteConversation = (id) => {
        setConversations(prev => prev.filter(c => c.id !== id))
        if (activeConversationId === id) {
            const remaining = conversations.filter(c => c.id !== id)
            if (remaining.length > 0) {
                setActiveConversationId(remaining[0].id)
            } else {
                createNewConversation()
            }
    }
  }

    const clearAllChats = () => {
        setConversations([])
        createNewConversation()
  }

    const activeConversation = conversations.find(c => c.id === activeConversationId)

    const addMessage = (content, role) => {
        const newMessage = {
            id: Date.now(),
            content,
            role,
            timestamp: new Date()
        }

        setConversations(prev =>
            prev.map(conv =>
                conv.id === activeConversationId
                    ? { ...conv, messages: [...conv.messages, newMessage] }
                    : conv
            )
        )
    }

    const updateLastMessage = (content) => {
        setConversations(prev =>
            prev.map(conv =>
                conv.id === activeConversationId
                    ? {
                        ...conv,
                        messages: conv.messages.map((msg, index) =>
                            index === conv.messages.length - 1
                                ? { ...msg, content }
                                : msg
                        )
                    }
                    : conv
            )
        )
    }

    const handleSubmit = async () => {
        if (!inputValue.trim() || isLoading) return

        const userMessage = inputValue.trim()
        setInputValue('')
    setIsLoading(true)

        // Add user message
        addMessage(userMessage, 'user')

        // Add loading assistant message
        addMessage('正在思考中...', 'assistant')

    try {
      const response = await fetch(`${SERVER_URL}/hyperrag/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            question: userMessage,
            mode: queryMode,
          top_k: 60,
          max_token_for_text_unit: 1600,
          max_token_for_entity_context: 300,
          max_token_for_relation_context: 1600,
          only_need_context: false,
          response_type: 'Multiple Paragraphs',
          database: storeGlobalUser.selectedDatabase
        }),
      })

      if (!response.ok) {
          throw new Error(`Network error: ${response.status}`)
      }

        const data = await response.json()

        if (data.success) {
        const modeNames = {
            'hyper': 'Hyper-RAG',
            'hyper-lite': 'Hyper-Lite',
            'naive': 'RAG'
        }
            const modeName = modeNames[queryMode] || queryMode
            const responseContent = `${data.response || 'No response content'}\n\n---\n*Mode: ${modeName}*`

            updateLastMessage(responseContent)
      } else {
            throw new Error(data.message || 'Query failed')
        }
    } catch (error) {
        console.error('Error sending message:', error)
        updateLastMessage(`Sorry, an error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsLoading(false)
    }
    }

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSubmit()
        }
    }

    // Effects
    useEffect(() => {
        storeGlobalUser.restoreSelectedDatabase()
        storeGlobalUser.loadDatabases()
        loadFromStorage()
    }, [])

    useEffect(() => {
        if (conversations.length > 0) {
            saveToStorage()
        }
    }, [conversations, activeConversationId])

    return (
        <div className="flex bg-gray-50">
            {/* Sidebar */}
            <div className="w-52 bg-gray-100 border-r border-gray-200 flex flex-col">

                {/* Mode Selector - Now prominently displayed */}

                <div className="flex items-center space-x-1 p-3">
                    <div className="flex flex-col bg-gray-100 rounded-lg p-1 w-full space-y-1">
                        <div className="flex items-center space-x-2 mb-3">
                            <Settings className="w-5 h-5 shrink-0 text-gray-500" />
                            <span className="font-medium text-gray-700 text-sm">Mode: </span>
                        </div>
                        <button
                            onClick={() => setQueryMode('hyper')}
                            className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 cursor-pointer ${queryMode === 'hyper'
                                ? 'bg-purple-500 text-white shadow-md'
                                : 'text-gray-600 hover:bg-gray-200'
                                }`}
                        >
                            <Zap className="w-4 h-4 shrink-0" />
                            <span>Hyper-RAG</span>
                        </button>
                        <button
                            onClick={() => setQueryMode('hyper-lite')}
                            className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 cursor-pointer ${queryMode === 'hyper-lite'
                                ? 'bg-green-500 text-white shadow-md'
                                : 'text-gray-600 hover:bg-gray-200'
                                }`}
                        >
                            <Layers className="w-4 h-4 shrink-0" />
                            <span>Hyper-Lite-RAG</span>
                        </button>
                        <button
                            onClick={() => setQueryMode('naive')}
                            className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 cursor-pointer ${queryMode === 'naive'
                                ? ' bg-blue-500 text-white shadow-md'
                                : 'text-gray-600 hover:bg-gray-200'
                                }`}
                        >
                            <BookOpen className="w-4 h-4 shrink-0" />
                            <span>Naive-RAG</span>
                        </button>
                    </div>
                </div>
                {/* Header */}
                <Separator className="my-3" />
                <div className="p-4 border-b border-gray-200">
                    <Button
                        onClick={createNewConversation}
                        className="w-full"
                        variant="outline"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        New Conversation
                    </Button>
                </div>

                {/* Conversations List */}
                <ScrollArea className="flex-1 p-2">
                    <div className="space-y-2">
                        {conversations.map((conv) => (
                            <div
                                key={conv.id}
                                className={`group p-1 rounded-lg cursor-pointer transition-colors ${activeConversationId === conv.id
                                    ? 'bg-blue-50 border border-blue-200'
                                    : 'hover:bg-gray-50'
                                    }`}
                                onClick={() => setActiveConversationId(conv.id)}
              >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-2 flex-1 min-w-0">
                                        <MessageCircle className="w-4 h-4 text-gray-500" />
                                        <span className="text-sm font-medium text-gray-900 truncate">
                                            {conv.title}
                                        </span>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="opacity-0 group-hover:opacity-100 h-6 w-6"
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            deleteConversation(conv.id)
                                        }}
                                    >
                                        <Trash2 className="w-3 h-3" />
                                    </Button>
                                </div>

                            </div>
                        ))}
                    </div>
                </ScrollArea>

                {/* Controls */}
                <div className="p-4 border-t border-gray-200 space-y-4">
                    <Button
                        variant="outline"
                        onClick={clearAllChats}
                        className="w-full"
                    >
                        <RotateCcw className="w-4 h-4 mr-2" />
                        Clear All Chats
                    </Button>
                </div>

            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col">
                {/* Top Bar */}
                <div className="bg-white border-b border-gray-200 p-4">
                    <div className="flex items-center justify-between w-full">
                        <div className="flex items-center space-x-4">
                            <Database className="w-5 h-5 text-gray-500" />
                            <span className="font-medium text-gray-700">Database:</span>
                            <DatabaseSelector
                                mode="buttons"
                                showCurrent={true}
                                showRefresh={true}
                                placeholder=""
                                style={{}}
                                size="small"
                                onChange={() => { }}
                                disabled={false}
                            />
                        </div>
                    </div>
                </div>

                {/* Chat Area */}
                <div className="flex-1 flex flex-col">
                    {/* Messages */}
                    <ScrollArea className="p-4 pb-0 h-[calc(100vh-210px)] bg-white">
                        {activeConversation?.messages.length === 0 ? (
                            <div className="flex-1 flex items-center justify-center mt-20">
                                <div className="text-center">
                                    <Bot className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                                        Welcome to Hyper-RAG
                                    </h3>
                                    <p className="text-gray-500 max-w-md">
                                        Ask me anything about your knowledge base. I&apos;ll help you find the
                                        information you need using advanced RAG technology.
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-6 max-w-4xl mx-auto">
                                {activeConversation?.messages.map((message) => (
                                    <div key={message.id + message.content} className="flex space-x-4">
                                        <Avatar>
                                            {message.role === 'user' ? (
                                                <AvatarFallback>
                                                    <User className="w-5 h-5" />
                                                </AvatarFallback>
                                            ) : (
                                                <AvatarFallback>
                                                    <Bot className="w-5 h-5" />
                                                </AvatarFallback>
                                            )}
                                        </Avatar>

                                        <div className="flex-1 space-y-2">
                                            <div className="flex items-center space-x-2">
                                                <span className="font-medium text-gray-900">
                                                    {message.role === 'user' ? 'You' : 'Hyper-RAG'}
                                                </span>
                                                <span className="text-xs text-gray-500">
                                                    {new Date(message.timestamp).toLocaleTimeString()}
                                                </span>
                                            </div>

                                            <div className={`rounded-lg p-4 ${message.role === 'user'
                                                ? 'bg-blue-50 border border-blue-200'
                                                : 'bg-gray-50 border border-gray-200'
                                                }`}>
                                                {message.role === 'assistant' ? (
                                                    <div className="prose prose-sm max-w-none">
                                                        <ReactMarkdown
                                                            components={{
                                                                p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                                                                code: ({ children, className }) => (
                                                                    <code className={`${className} bg-gray-100 px-1 rounded`}>
                                                                        {children}
                                                                    </code>
                                                                ),
                                                                pre: ({ children }) => (
                                                                    <pre className="bg-gray-100 p-3 rounded-md overflow-x-auto">
                                                                        {children}
                                                                    </pre>
                                                                ),
                                                            }}
                                                        >
                                                            {message.content}
                                                        </ReactMarkdown>
                                                    </div>
                                                ) : (
                                                        <p className="text-gray-900 whitespace-pre-wrap m-0">
                                                        {message.content}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                </div>
                        )}
                    </ScrollArea>

                    {/* Input Area */}
                    <div className="border-t border-gray-200 bg-white p-2">
                        <div className="max-w-4xl mx-auto">
                            <div className="flex space-x-4 items-center">
                                <Textarea
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    onKeyPress={handleKeyPress}
                                    placeholder="Ask me anything about your knowledge base..."
                                    className="flex-1 h-7 resize-none"
                                    disabled={isLoading}
                                />
                                <Button 
                                    onClick={handleSubmit}
                                    disabled={!inputValue.trim() || isLoading}
                                    size="lg"
                                    className="px-6"
                                >
                                    {isLoading ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <Send className="w-4 h-4" />
                                    )}
                                </Button>
                            </div>
                        </div>
                    </div>
        </div>
      </div>
    </div>
  )
}

export default observer(HyperRAGHome) 