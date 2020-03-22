import { AppRegistry, ComponentProvider } from 'react-native'
import React, { useEffect, ComponentType } from 'react'
import { Navigator } from './Navigator'
import {
  NavigationModule,
  EventEmitter,
  EVENT_NAVIGATION,
  KEY_SCENE_ID,
  KEY_ON,
  ON_COMPONENT_MOUNT,
  ON_COMPONENT_APPEAR,
  ON_COMPONENT_DISAPPEAR,
} from './NavigationModule'
import { Garden, NavigationItem } from './Garden'
import { router, RouteConfig } from './router'
import store from './store'
import { bindBarButtonItemClickEvent, removeBarButtonItemClickEvent } from './utils'
import { useResult } from './hooks'

export interface InjectedProps {
  navigator: Navigator
  garden: Garden
  sceneId: string
}

interface Props {
  sceneId: string
}

function getDisplayName(WrappedComponent: React.ComponentType<any>) {
  return WrappedComponent.displayName || WrappedComponent.name || 'Component'
}

function withNavigator(moduleName: string) {
  return function(WrappedComponent: React.ComponentType<any>) {
    function FC(props: Props, ref: React.Ref<React.ComponentType<any>>) {
      const { sceneId } = props
      const navigator = store.getNavigator(sceneId) || new Navigator(sceneId, moduleName)
      if (navigator.moduleName === undefined) {
        navigator.moduleName = moduleName
      }
      store.addNavigator(sceneId, navigator)
      const garden = new Garden(sceneId)

      useEffect(() => {
        navigator.signalFirstRenderComplete()
        return () => {
          removeBarButtonItemClickEvent(navigator.sceneId)
          store.removeNavigator(navigator.sceneId)
          navigator.unmount()
        }
      }, [navigator])

      useEffect(() => {
        const subscription = EventEmitter.addListener(EVENT_NAVIGATION, data => {
          if (navigator.sceneId === data[KEY_SCENE_ID] && data[KEY_ON] === ON_COMPONENT_MOUNT) {
            navigator.signalFirstRenderComplete()
          }
        })
        return () => {
          subscription.remove()
        }
      }, [navigator])

      useEffect(() => {
        const subscription = EventEmitter.addListener(EVENT_NAVIGATION, data => {
          if (navigator.sceneId === data[KEY_SCENE_ID]) {
            if (data[KEY_ON] === ON_COMPONENT_APPEAR) {
              navigator.visibility = 'visible'
            } else if (data[KEY_ON] === ON_COMPONENT_DISAPPEAR) {
              navigator.visibility = 'gone'
            }
          }
        })
        return () => {
          subscription.remove()
        }
      }, [navigator])

      useResult(sceneId, (requestcode, resultCode, data) => {
        navigator.result(requestcode, resultCode, data)
      })

      const injected = {
        garden,
        navigator,
      }
      return <WrappedComponent ref={ref} {...props} {...injected} />
    }

    const FREC = React.forwardRef(FC)
    FREC.displayName = `withNavigator(${getDisplayName(WrappedComponent)})`
    return FREC
  }
}

export type HOC = (WrappedComponent: React.ComponentType<any>) => React.ComponentType<any>
let wrap: HOC | undefined

export class ReactRegistry {
  static registerEnded: boolean
  static startRegisterComponent(hoc?: HOC) {
    router.clear()
    store.clear()
    wrap = hoc
    ReactRegistry.registerEnded = false
    NavigationModule.startRegisterReactComponent()
  }

  static endRegisterComponent() {
    if (ReactRegistry.registerEnded) {
      console.warn(`Please don't call ReactRegistry#endRegisterComponent multiple times.`)
      return
    }
    ReactRegistry.registerEnded = true
    NavigationModule.endRegisterReactComponent()
  }

  static registerComponent(
    appKey: string,
    getComponentFunc: ComponentProvider,
    routeConfig?: RouteConfig,
  ) {
    if (routeConfig) {
      router.addRouteConfig(appKey, routeConfig)
    }

    const WrappedComponent = getComponentFunc()

    // build static options
    let options: object =
      bindBarButtonItemClickEvent((WrappedComponent as any).navigationItem) || {}
    NavigationModule.registerReactComponent(appKey, options)

    let RootComponent: React.ComponentType<any>
    if (wrap) {
      RootComponent = wrap(withNavigator(appKey)(WrappedComponent))
    } else {
      RootComponent = withNavigator(appKey)(WrappedComponent)
    }
    AppRegistry.registerComponent(appKey, () => RootComponent)
  }
}

export function withNavigationItem(item: NavigationItem) {
  return function(Func: ComponentType<any>) {
    ;(Func as any).navigationItem = item
    return Func
  }
}
