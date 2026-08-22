import { useRef } from 'react'
import { Modal } from '@/components/ui'
import { Printer, Download, GraduationCap, CreditCard } from 'lucide-react'

const QR_PLACEHOLDER = (studentId) =>
  `https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${encodeURIComponent(studentId)}&bgcolor=0B1D3A&color=D4A24C&qzone=2`

export default function StudentIdCard({ student, isOpen, onClose }) {
  const printRef = useRef(null)

  if (!student) return null

  const printCard = () => {
    const w = window.open('', '_blank', 'width=600,height=420')
    w.document.write(`
      <!DOCTYPE html><html><head><title>Student ID Card - ${student.fullName}</title>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=JetBrains+Mono:wght@500&display=swap" rel="stylesheet">
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #f8fafc; display: flex; align-items: center; justify-content: center; min-height: 100vh; font-family: 'Inter', sans-serif; }
        .card { width: 340px; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.25); }
        .card-front { background: #0B1D3A; padding: 24px; position: relative; }
        .stripe { height: 4px; background: linear-gradient(90deg, #D4A24C, #E3C079, #D4A24C); margin-bottom: 16px; border-radius: 2px; }
        .header { display: flex; align-items: center; gap: 10px; margin-bottom: 20px; }
        .logo { width: 36px; height: 36px; background: rgba(212,162,76,0.15); border: 1px solid rgba(212,162,76,0.4); border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 18px; }
        .institute { color: #FBF9F3; font-size: 13px; font-weight: 700; line-height: 1.2; }
        .sub { color: rgba(251,249,243,0.5); font-size: 10px; }
        .body { display: flex; justify-content: space-between; align-items: center; }
        .info { flex: 1; }
        .name { color: #FBF9F3; font-size: 17px; font-weight: 700; margin-bottom: 12px; }
        .row { margin-bottom: 6px; }
        .lbl { color: rgba(251,249,243,0.45); font-size: 9px; text-transform: uppercase; letter-spacing: 0.5px; }
        .val { color: rgba(251,249,243,0.85); font-size: 11px; font-family: 'JetBrains Mono', monospace; font-weight: 500; }
        .qr { width: 80px; height: 80px; border-radius: 8px; border: 2px solid rgba(212,162,76,0.3); }
        .footer { background: #D4A24C; padding: 10px 24px; display: flex; justify-content: space-between; align-items: center; }
        .id-label { font-size: 9px; color: rgba(11,29,58,0.6); text-transform: uppercase; letter-spacing: 0.5px; }
        .id-val { font-family: 'JetBrains Mono', monospace; font-size: 13px; font-weight: 700; color: #0B1D3A; }
        @media print { body { background: white; } .card { box-shadow: none; } }
      </style></head><body>
      <div class="card">
        <div class="card-front">
          <div class="stripe"></div>
          <div class="header">
            <div class="logo">🎓</div>
            <div>
              <div class="institute">Vanita Math Classes</div>
              <div class="sub">Student Identity Card</div>
            </div>
          </div>
          <div class="body">
            <div class="info">
              <div class="name">${student.fullName}</div>
              <div class="row"><div class="lbl">Standard</div><div class="val">${student.class}${student.section ? ` — ${student.section}` : ''}</div></div>
              <div class="row"><div class="lbl">Batch</div><div class="val">${student.batch}</div></div>
              <div class="row"><div class="lbl">Phone</div><div class="val">${student.phone || '—'}</div></div>
              <div class="row"><div class="lbl">Academic Year</div><div class="val">${student.academicYear || new Date().getFullYear()}</div></div>
            </div>
            <img class="qr" src="${QR_PLACEHOLDER(student.studentId)}" alt="QR" />
          </div>
        </div>
        <div class="footer">
          <div><div class="id-label">Student ID</div><div class="id-val">${student.studentId}</div></div>
          <div style="text-align:right"><div class="id-label">Valid For</div><div class="id-val">${student.academicYear || new Date().getFullYear()}</div></div>
        </div>
      </div>
      <script>window.onload=()=>window.print()</script>
      </body></html>
    `)
    w.document.close()
  }

  const downloadSvg = () => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="340" height="200" viewBox="0 0 340 200">
      <defs><linearGradient id="stripe" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" style="stop-color:#D4A24C"/><stop offset="50%" style="stop-color:#E3C079"/><stop offset="100%" style="stop-color:#D4A24C"/></linearGradient></defs>
      <rect width="340" height="200" rx="16" fill="#0B1D3A"/>
      <rect y="0" width="340" height="4" rx="2" fill="url(#stripe)"/>
      <rect x="20" y="20" width="36" height="36" rx="8" fill="rgba(212,162,76,0.15)" stroke="rgba(212,162,76,0.4)" stroke-width="1"/>
      <text x="38" y="42" font-size="18" text-anchor="middle" fill="#D4A24C">🎓</text>
      <text x="65" y="33" font-family="Inter,sans-serif" font-size="12" font-weight="700" fill="#FBF9F3">Vanita Math Classes</text>
      <text x="65" y="47" font-family="Inter,sans-serif" font-size="9" fill="rgba(251,249,243,0.5)">Student Identity Card</text>
      <text x="20" y="80" font-family="Inter,sans-serif" font-size="15" font-weight="700" fill="#FBF9F3">${student.fullName}</text>
      <text x="20" y="102" font-family="Inter,sans-serif" font-size="8" fill="rgba(251,249,243,0.45)" letter-spacing="0.5">STANDARD</text>
      <text x="20" y="114" font-family="monospace" font-size="10" fill="rgba(251,249,243,0.85)">${student.class}${student.section ? ` — ${student.section}` : ''}</text>
      <text x="20" y="132" font-family="Inter,sans-serif" font-size="8" fill="rgba(251,249,243,0.45)" letter-spacing="0.5">BATCH</text>
      <text x="20" y="144" font-family="monospace" font-size="10" fill="rgba(251,249,243,0.85)">${student.batch}</text>
      <rect y="162" width="340" height="38" rx="0" fill="#D4A24C"/>
      <rect y="162" width="340" height="38" rx="0" fill="#D4A24C"/>
      <text x="20" y="175" font-family="Inter,sans-serif" font-size="8" fill="rgba(11,29,58,0.6)" letter-spacing="0.5">STUDENT ID</text>
      <text x="20" y="190" font-family="monospace" font-size="13" font-weight="700" fill="#0B1D3A">${student.studentId}</text>
    </svg>`
    const blob = new Blob([svg], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${student.studentId}-id-card.svg`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Student ID Card" size="sm">
      <div className="p-6">
        {/* Card preview */}
        <div ref={printRef} className="rounded-2xl overflow-hidden shadow-2xl shadow-slate-900/30 mb-5" style={{ background: '#0B1D3A' }}>
          <div className="h-1" style={{ background: 'linear-gradient(90deg, #D4A24C, #E3C079, #D4A24C)' }} />
          <div className="p-5">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(212,162,76,0.15)', border: '1px solid rgba(212,162,76,0.4)' }}>
                <GraduationCap className="w-4 h-4" style={{ color: '#D4A24C' }} />
              </div>
              <div>
                <p className="text-xs font-bold" style={{ color: '#FBF9F3' }}>Vanita Math Classes</p>
                <p className="text-[9px]" style={{ color: 'rgba(251,249,243,0.5)' }}>Student Identity Card</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex-1">
                <p className="text-sm font-bold mb-3" style={{ color: '#FBF9F3' }}>{student.fullName}</p>
                {[['Standard', `${student.class}${student.section ? ` — ${student.section}` : ''}`], ['Batch', student.batch], ['Phone', student.phone || '—']].map(([l, v]) => (
                  <div key={l} className="mb-1.5">
                    <p className="text-[8px] uppercase tracking-wider" style={{ color: 'rgba(251,249,243,0.4)' }}>{l}</p>
                    <p className="font-mono text-[10px]" style={{ color: 'rgba(251,249,243,0.85)' }}>{v}</p>
                  </div>
                ))}
              </div>
              <img src={QR_PLACEHOLDER(student.studentId)} alt="QR Code" className="w-16 h-16 rounded-lg" style={{ border: '1.5px solid rgba(212,162,76,0.3)' }} />
            </div>
          </div>
          <div className="px-5 py-3 flex items-center justify-between" style={{ background: '#D4A24C' }}>
            <div>
              <p className="text-[8px] uppercase tracking-wider" style={{ color: 'rgba(11,29,58,0.6)' }}>Student ID</p>
              <p className="font-mono text-xs font-bold" style={{ color: '#0B1D3A' }}>{student.studentId}</p>
            </div>
            <div className="text-right">
              <p className="text-[8px] uppercase tracking-wider" style={{ color: 'rgba(11,29,58,0.6)' }}>Academic Year</p>
              <p className="font-mono text-xs font-bold" style={{ color: '#0B1D3A' }}>{student.academicYear || new Date().getFullYear()}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button onClick={printCard} className="btn btn-primary justify-center">
            <Printer className="w-4 h-4" /> Print Card
          </button>
          <button onClick={downloadSvg} className="btn btn-secondary justify-center">
            <Download className="w-4 h-4" /> Download SVG
          </button>
        </div>
      </div>
    </Modal>
  )
}
