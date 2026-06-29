import React from 'react'
import { JSONTree } from 'react-json-tree'
import type { TabType } from '../types'
import { OpenEOViewer } from './OpenEOViewer'
import { JsonlView } from './JsonlView'

interface JsonContentProps {
  activeTab: TabType
  mode: 'json' | 'jsonl'
  data: any
  jsonText: string
  records?: any[]
  url: string
  theme: any
  shouldExpandAll: boolean
  shouldExpandNodeInitially: () => boolean
  isPrettyPrinted: boolean
}

// Cap what we drop into a single <pre>: a multi-hundred-MB text node hangs/crashes the tab.
const RAW_LIMIT = 2_000_000
const JSONL_RAW_RECORDS = 1000

export const JsonContent: React.FC<JsonContentProps> = ({
  activeTab,
  mode,
  data,
  jsonText,
  records = [],
  url,
  theme,
  shouldExpandAll,
  shouldExpandNodeInitially,
  isPrettyPrinted,
}) => {
  const getRawText = (): string => {
    if (mode === 'jsonl') {
      return records
        .slice(0, JSONL_RAW_RECORDS)
        .map((r) =>
          isPrettyPrinted ? JSON.stringify(r, null, 2) : JSON.stringify(r)
        )
        .join('\n')
    }
    // Pretty-print re-stringifies the whole tree — skip it when the source is already large.
    if (isPrettyPrinted && jsonText.length <= RAW_LIMIT) {
      return JSON.stringify(data, null, 2)
    }
    return jsonText
  }

  const rawText = activeTab === 'raw' ? getRawText() : ''
  const rawTruncated =
    rawText.length > RAW_LIMIT ||
    (mode === 'jsonl' && records.length > JSONL_RAW_RECORDS)

  return (
    <div className="content">
      {activeTab === 'json' && mode === 'jsonl' && (
        <JsonlView
          records={records}
          theme={theme}
          expandRows={shouldExpandAll}
        />
      )}
      {activeTab === 'json' && mode === 'json' && (
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
          {rawTruncated && (
            <p className="raw-truncated">
              {mode === 'jsonl'
                ? `Showing first ${JSONL_RAW_RECORDS.toLocaleString()} of ${records.length.toLocaleString()} records.`
                : `Showing first ${(RAW_LIMIT / 1_000_000).toFixed(
                    0
                  )}MB — download to view the full file.`}
            </p>
          )}
          <pre>{rawText.slice(0, RAW_LIMIT)}</pre>
        </div>
      )}
      {activeTab === 'stac' && <OpenEOViewer url={url} />}
    </div>
  )
}
