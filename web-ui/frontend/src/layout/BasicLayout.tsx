import { storeGlobalUser } from '@/store/globalUser'
import { storage } from '@/utils'
import { PageContainer, ProLayout } from '@ant-design/pro-components'
import { RouteType, router } from '@config/routes'
import { useAsyncEffect } from 'ahooks'
import { Dropdown, MenuProps } from 'antd'
import { useEffect, useState } from 'react'
import { Outlet, matchRoutes, useLocation, useNavigate } from 'react-router-dom'
import defaultProps from '@/_defaultProps'
import Settings from '@config/defaultSettings'
import { observer } from 'mobx-react'
import React from 'react'
import { routers } from '@config/routes/routers'
import { useTranslation } from 'react-i18next'

export enum ComponTypeEnum {
  MENU,
  PAGE,
  COMPON
}

export const GlobalUserInfo = React.createContext<Partial<User.UserEntity>>({})

const BasicLayout: React.FC = props => {
  const { t } = useTranslation()
  const [pathname, setPathname] = useState(window.location.hash.replace('#', ''))
  const navigate = useNavigate()
  const location = useLocation()
  const matchRoute = matchRoutes(routers, location)

  const [showLayout, setShowLayout] = useState(false)

  /** 处理菜单权限隐藏菜单 */
  const reduceRouter = (routers: RouteType[]): RouteType[] => {
    const authMenus = storeGlobalUser?.userInfo?.menus
      ?.filter(item => item?.type === ComponTypeEnum.MENU || item?.type === ComponTypeEnum.PAGE)
      ?.map(item => item?.title)

    return routers?.map(item => {
      if (item?.children) {
        const { children, ...extra } = item
        return {
          ...extra,
          routes: reduceRouter(item?.children),
          hideInMenu: item?.hideInMenu
        }
      }

      // 为菜单项添加国际化支持
      let translatedName = item?.name
      if (item?.path === '/Hyper/show') {
        translatedName = t('menu.graph')
      } else if (item?.path === '/Hyper/DB') {
        translatedName = t('menu.database')
      } else if (item?.path === '/Hyper/chat') {
        translatedName = t('menu.home')
      } else if (item?.path === '/Hyper/files') {
        translatedName = t('menu.files')
      } else if (item?.path === '/API') {
        translatedName = t('menu.api')
      } else if (item?.path === '/Setting') {
        translatedName = t('menu.settings')
      }

      return {
        ...item,
        name: translatedName,
        hideInMenu: item?.hideInMenu
      }
    }) as any
  }

  useEffect(() => {
    setPathname(window.location.hash.replace('#', ''))
    setShowLayout(!matchRoute?.[matchRoute?.length - 1]?.route?.hideLayout)
  }, [window.location.hash])

  useAsyncEffect(async () => {
    if (pathname !== '/login') {
      await storeGlobalUser.getUserDetail()
    }
  }, [])

  const items: MenuProps['items'] = [
    {
      key: 'out',
      label: (
        <div
          onClick={() => {
            storage.clear()
            // navigate('login', { replace: true })
          }}
        >
          {t('common.logout')}
        </div>
      )
    }
  ]

  return (
    <GlobalUserInfo.Provider value={storeGlobalUser.userInfo}>
      {showLayout ? (
        <ProLayout
          {...defaultProps}
          route={reduceRouter(router?.routes)?.[1]}
          location={{
            pathname
          }}
          avatarProps={{
            src: storeGlobalUser.userInfo?.icon,
            size: 'small',
            title: storeGlobalUser.userInfo?.username,
            render: (_, defaultDom) => {
              return <Dropdown menu={{ items }}>{defaultDom}</Dropdown>
            }
          }}
          menuFooterRender={props => {
            return (
              <div
                style={{
                  textAlign: 'center',
                  paddingBlockStart: 12
                }}
              >
                <div></div>
                <div></div>
              </div>
            )
          }}
          menuProps={{
            onClick: ({ key }) => {
              navigate(key || '/')
            }
          }}
          ErrorBoundary={false}
          {...Settings}
        >
          {/* <PageContainer> */}
          <Outlet />
          {/* </PageContainer> */}
        </ProLayout>
      ) : (
        <Outlet />
      )}
    </GlobalUserInfo.Provider>
  )
}

export default observer(BasicLayout)
