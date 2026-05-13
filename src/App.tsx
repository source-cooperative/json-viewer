import React, { useState, useEffect, useCallback } from 'react'
import { useMedia } from 'react-use'
import type { AppState, TabType, ThemeType } from './types'
import { lightTheme, darkTheme } from './themes'
import {
  NoUrlMessage,
  LoadingMessage,
  ErrorMessage,
  Tabs,
  Toolbar,
  JsonContent,
  FullscreenButton,
} from './components'
import './index.css'

const isStac = (data: unknown): boolean => {
  if (!data || typeof data !== 'object') return false
  const obj = data as Record<string, unknown>
  const type = typeof obj.type === 'string' ? obj.type : null
  if (type === 'Catalog' || type === 'Collection' || type === 'Feature') {
    return typeof obj.stac_version === 'string'
  }
  return typeof obj.stac_version === 'string'
}

const App: React.FC = () => {
  const prefersDark = useMedia('(prefers-color-scheme: dark)')
  const [userTheme, setUserTheme] = useState<ThemeType>(() => {
    const saved = localStorage.getItem('theme')
    return saved === 'light' || saved === 'dark' ? saved : undefined
  })
  const [state, setState] = useState<AppState>({ type: 'no-url' })
  const [activeTab, setActiveTab] = useState<TabType | null>(null)
  const [shouldExpandAll, setShouldExpandAll] = useState(true)
  const [isPrettyPrinted, setIsPrettyPrinted] = useState(true)

  const theme = userTheme ?? (prefersDark ? 'dark' : 'light')
  const jsonTheme = theme === 'dark' ? darkTheme : lightTheme

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    document.documentElement.style.setProperty('color-scheme', theme)
  }, [theme])

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const jsonUrl = urlParams.get('url')
    const tab = urlParams.get('tab') as TabType | null
    if (tab) {
      setActiveTab(tab)
    }

    if (!jsonUrl) {
      setState({ type: 'no-url' })
      return
    }

    setState({ type: 'loading', url: jsonUrl })

    fetch(jsonUrl)
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        const text = await response.text()
        const data = JSON.parse(text)
        setState({ type: 'success', url: jsonUrl, data, jsonText: text })
        setActiveTab((current) => current ?? (isStac(data) ? 'stac' : 'json'))
      })
      .catch((error) => {
        setState({
          type: 'error',
          url: jsonUrl,
          error: error instanceof Error ? error.message : String(error),
        })
      })
  }, [])

  const handleThemeChange = (newTheme: string) => {
    if (newTheme === 'light' || newTheme === 'dark') {
      setUserTheme(newTheme)
      localStorage.setItem('theme', newTheme)
    } else {
      setUserTheme(undefined)
      localStorage.removeItem('theme')
    }
  }

  const handleSave = () => {
    if (state.type !== 'success') return

    const blob = new Blob([state.jsonText], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url

    let filename = decodeURIComponent(state.url).split('/').pop() || 'download'
    if (!/\.json$/.test(filename)) {
      filename += '.json'
    }

    link.download = filename
    link.click()
    URL.revokeObjectURL(url)
  }

  const handleCopy = async () => {
    if (state.type !== 'success') return

    try {
      await navigator.clipboard.writeText(state.jsonText)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const handleCollapseAll = () => {
    setShouldExpandAll(false)
  }

  const handleExpandAll = () => {
    setShouldExpandAll(true)
  }

  const handlePrettyPrint = () => {
    setIsPrettyPrinted(!isPrettyPrinted)
  }

  const shouldExpandNodeInitially = useCallback(() => {
    return shouldExpandAll
  }, [shouldExpandAll])

  const renderBody = () => {
    if (state.type === 'no-url') {
      return <NoUrlMessage />
    }

    if (state.type === 'loading') {
      return <LoadingMessage url={state.url} />
    }

    if (state.type === 'error') {
      return <ErrorMessage url={state.url} error={state.error} />
    }

    if (activeTab === null) {
      return <LoadingMessage url={state.url} />
    }

    return (
      <div className="json-viewer-app">
        <Tabs
          activeTab={activeTab}
          onTabChange={setActiveTab}
          userTheme={userTheme}
          onThemeChange={handleThemeChange}
        />

        {activeTab !== 'stac' && (
          <Toolbar
            activeTab={activeTab}
            onSave={handleSave}
            onCopy={handleCopy}
            onCollapseAll={handleCollapseAll}
            onExpandAll={handleExpandAll}
            isPrettyPrinted={isPrettyPrinted}
            onTogglePrettyPrint={handlePrettyPrint}
          />
        )}

        <JsonContent
          activeTab={activeTab}
          data={state.data}
          jsonText={state.jsonText}
          url={state.url}
          theme={jsonTheme}
          shouldExpandAll={shouldExpandAll}
          shouldExpandNodeInitially={shouldExpandNodeInitially}
          isPrettyPrinted={isPrettyPrinted}
        />
      </div>
    )
  }

  return (
    <>
      {renderBody()}
      <FullscreenButton />
    </>
  )
}

export default App
