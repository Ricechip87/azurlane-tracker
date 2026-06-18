import { useRef, useState } from 'react'
import { createBackup, parseBackup } from '../utils/backup.js'

export default function BackupPanel({ userData, setUserData, compact = false }) {
  const fileInputRef = useRef(null)
  const [message, setMessage] = useState('')
  const savedCount = Object.keys(userData).length

  const exportBackup = async () => {
    const backup = createBackup(userData)
    const date = backup.exportedAt.slice(0, 10)
    const fileName = `azurlane-backup-${date}.json`
    const backupText = JSON.stringify(backup, null, 2)

    if (typeof window.showSaveFilePicker === 'function' && window.isSecureContext) {
      try {
        const handle = await window.showSaveFilePicker({
          suggestedName: fileName,
          types: [
            {
              description: 'JSON 백업 파일',
              accept: { 'application/json': ['.json'] },
            },
          ],
        })
        const blob = new Blob([backupText], { type: 'application/json' })
        const writable = await handle.createWritable()
        await writable.write(blob)
        await writable.close()
        setMessage(`백업 파일 저장 완료: ${savedCount}명`)
        return
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          setMessage('백업 저장 취소')
          return
        }
        setMessage('저장 위치 선택을 사용할 수 없어 다운로드로 저장했습니다.')
      }
    } else {
      setMessage('Firefox는 저장 위치 선택을 지원하지 않습니다. Firefox 다운로드 설정에서 저장 위치 묻기를 켜면 선택할 수 있습니다.')
    }

    const blob = new Blob([backupText], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = fileName
    link.click()
    URL.revokeObjectURL(url)
    setMessage(`백업 파일 생성 완료: ${savedCount}명`)
  }

  const importBackup = async (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    try {
      const text = await file.text()
      const nextUserData = parseBackup(text)
      setUserData(nextUserData)
      setMessage(`복원 완료: ${Object.keys(nextUserData).length}명`)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '복원에 실패했습니다.')
    }
  }

  const controls = (
    <>
      <button
        type="button"
        onClick={exportBackup}
        className="rounded border border-neutral-600 bg-[#303030] px-3 py-1.5 text-sm font-medium text-gray-100 hover:bg-neutral-700"
      >
        내보내기
      </button>

      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        className="rounded border border-neutral-700 bg-[#2b2b2b] px-3 py-1.5 text-sm font-medium text-gray-200 hover:bg-neutral-700"
      >
        가져오기
      </button>

      <input
        ref={fileInputRef}
        type="file"
        accept="application/json,.json"
        onChange={importBackup}
        className="hidden"
      />
    </>
  )

  if (compact) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-semibold text-gray-300">입력 데이터</span>
        <span className="text-xs text-gray-500">저장 {savedCount}명</span>
        {controls}
        {message && <span className="text-xs text-gray-400">{message}</span>}
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-neutral-700 bg-[#242424] px-4 py-3">
      <div className="flex flex-wrap items-center gap-3">
        <div className="mr-auto">
          <div className="text-sm font-semibold text-gray-200">데이터 백업</div>
          <div className="text-xs text-gray-500">LocalStorage 저장 데이터 {savedCount}명</div>
        </div>

        {controls}
      </div>

      {message && (
        <div className="mt-2 text-xs text-gray-400">{message}</div>
      )}
    </div>
  )
}
