import React from 'react'
import { JSONTree } from 'react-json-tree'
import type { TabType } from '../types'
import { OpenEOViewer } from './OpenEOViewer'
import { StacPreview } from './StacPreview'

interface JsonContentProps {
  activeTab: TabType
  data: any
  jsonText: string
  url: string
  theme: any
  shouldExpandAll: boolean
  shouldExpandNodeInitially: () => boolean
  isPrettyPrinted: boolean
}

export const JsonContent: React.FC<JsonContentProps> = ({
  activeTab,
  data,
  jsonText,
  url,
  theme,
  shouldExpandAll,
  shouldExpandNodeInitially,
  isPrettyPrinted
}) => {
  const getRawJsonDisplay = () => {
    if (isPrettyPrinted) {
      return JSON.stringify(data, null, 2)
    }
    return jsonText
  }

  return (
    <div className="content">
      {activeTab === 'json' && (
        <div className="json-content">
          <JSONTree
            key={shouldExpandAll ? 'expanded' : 'collapsed'}
            data={data}
            theme={theme}
            invertTheme={false}
            shouldExpandNodeInitially={shouldExpandNodeInitially}
            hideRoot={true}
          />
        </div>
      )}
      {activeTab === 'raw' && (
        <div className="raw-content">
          <pre>{getRawJsonDisplay()}</pre>
        </div>
      )}
      {activeTab === 'stac' && <OpenEOViewer url={url} />}
      {activeTab === 'preview' && <StacPreview data={data} />}
    </div>
  )
}
