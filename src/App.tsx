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
import { load } from './load'
import './index.css'

// Above this size, auto-expanding the whole react-json-tree freezes the tab, so start collapsed.
const LARGE_TEXT = 2_000_000

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

    load(jsonUrl)
      .then((result) => {
        if (result.mode === 'jsonl') {
          setState({
            type: 'success',
            url: jsonUrl,
            mode: 'jsonl',
            records: result.records,
          })
          setActiveTab((current) => (current === 'raw' ? 'raw' : 'json'))
          return
        }
        setState({
          type: 'success',
          url: jsonUrl,
          mode: 'json',
          data: result.data,
          jsonText: result.jsonText,
        })
        setShouldExpandAll(result.jsonText.length <= LARGE_TEXT)
        setActiveTab(
          (current) => current ?? (isStac(result.data) ? 'stac' : 'json')
        )
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

    // JSONL records aren't kept as one string (could be GBs) — download straight from the URL.
    // New tab so a cross-origin navigation can't replace the viewer.
    if (state.mode === 'jsonl') {
      const link = document.createElement('a')
      link.href = state.url
      link.target = '_blank'
      link.rel = 'noopener'
      link.download =
        decodeURIComponent(state.url).split('/').pop() || 'download'
      link.click()
      return
    }

    const blob = new Blob([state.jsonText], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url

    let filename = decodeURIComponent(state.url).split('/').pop() || 'download'
    if (!/\.(json|jsonl|ndjson)$/i.test(filename)) {
      filename += '.json'
    }

    link.download = filename
    link.click()
    URL.revokeObjectURL(url)
  }

  const handleCopy = async () => {
    if (state.type !== 'success') return

    // ponytail: JSONL copy is the first 1000 records, not the whole file (which may be huge).
    const text =
      state.mode === 'jsonl'
        ? state.records
            .slice(0, 1000)
            .map((r) => JSON.stringify(r))
            .join('\n')
        : state.jsonText

    try {
      await navigator.clipboard.writeText(text)
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

    const isJsonl = state.mode === 'jsonl'
    const tooBigToExpand =
      state.mode === 'json' && state.jsonText.length > LARGE_TEXT

    return (
      <div className="json-viewer-app">
        <Tabs
          activeTab={activeTab}
          onTabChange={setActiveTab}
          userTheme={userTheme}
          onThemeChange={handleThemeChange}
          showStac={!isJsonl}
        />

        {activeTab !== 'stac' && (
          <Toolbar
            activeTab={activeTab}
            onSave={handleSave}
            onCopy={handleCopy}
            onCollapseAll={handleCollapseAll}
            onExpandAll={handleExpandAll}
            disableExpandAll={tooBigToExpand}
            isPrettyPrinted={isPrettyPrinted}
            onTogglePrettyPrint={handlePrettyPrint}
          />
        )}

        <JsonContent
          activeTab={activeTab}
          mode={state.mode}
          data={state.mode === 'json' ? state.data : undefined}
          jsonText={state.mode === 'json' ? state.jsonText : ''}
          records={state.mode === 'jsonl' ? state.records : undefined}
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
