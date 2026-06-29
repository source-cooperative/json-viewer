import React from 'react'
import type { TabType, ThemeType } from '../types'

interface TabsProps {
  activeTab: TabType
  onTabChange: (tab: TabType) => void
  userTheme: ThemeType
  onThemeChange: (theme: string) => void
  showStac: boolean
}

export const Tabs: React.FC<TabsProps> = ({
  activeTab,
  onTabChange,
  userTheme,
  onThemeChange,
  showStac,
}) => (
  <div className="tabs">
    <button
      className={`tab ${activeTab === 'json' ? 'active' : ''}`}
      onClick={() => onTabChange('json')}
    >
      JSON
    </button>
    <button
      className={`tab ${activeTab === 'raw' ? 'active' : ''}`}
      onClick={() => onTabChange('raw')}
    >
      Raw Data
    </button>
    {showStac && (
      <button
        className={`tab ${activeTab === 'stac' ? 'active' : ''}`}
        onClick={() => onTabChange('stac')}
      >
        STAC
      </button>
    )}
    <div className="tab-spacer"></div>
    <div className="header-right">
      <label htmlFor="theme-select">Theme:</label>
      <select
        id="theme-select"
        value={userTheme ?? 'system'}
        onChange={(e) => onThemeChange(e.target.value)}
      >
        <option value="system">system</option>
        <option value="light">light</option>
        <option value="dark">dark</option>
      </select>
    </div>
  </div>
)
