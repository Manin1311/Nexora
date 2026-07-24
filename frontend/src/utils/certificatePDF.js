import { jsPDF } from 'jspdf'
import html2canvas from 'html2canvas'

export const downloadCertificatePDF = async ({ name, title, score, id, date }) => {
  // Create a hidden wrapper container styled with high-fidelity landscape dimensions (A4 @ 96 DPI: 1123px x 794px)
  const container = document.createElement('div')
  container.style.position = 'absolute'
  container.style.left = '-9999px'
  container.style.top = '-9999px'
  container.style.width = '1123px'
  container.style.height = '794px'
  container.style.background = '#faf9f5'
  container.style.color = '#1e293b'
  container.style.boxSizing = 'border-box'
  container.style.padding = '40px'
  
  // Custom font stack for certificate look
  container.style.fontFamily = 'Georgia, serif'

  // Outer blue border and inner gold borders
  const innerContainer = document.createElement('div')
  innerContainer.style.width = '100%'
  innerContainer.style.height = '100%'
  innerContainer.style.border = '16px solid #0f172a' // Dark Navy
  innerContainer.style.boxSizing = 'border-box'
  innerContainer.style.position = 'relative'
  innerContainer.style.display = 'flex'
  innerContainer.style.flexDirection = 'column'
  innerContainer.style.alignItems = 'center'
  innerContainer.style.justifyContent = 'center'
  innerContainer.style.padding = '50px'

  // Gold double border lining
  const goldBorder = document.createElement('div')
  goldBorder.style.position = 'absolute'
  goldBorder.style.top = '10px'
  goldBorder.style.left = '10px'
  goldBorder.style.right = '10px'
  goldBorder.style.bottom = '10px'
  goldBorder.style.border = '4px double #d4af37' // Rich Gold
  goldBorder.style.pointerEvents = 'none'
  innerContainer.appendChild(goldBorder)

  // Decorative corner brackets in gold
  const corners = ['top-left', 'top-right', 'bottom-left', 'bottom-right']
  corners.forEach(corner => {
    const el = document.createElement('div')
    el.style.position = 'absolute'
    el.style.width = '24px'
    el.style.height = '24px'
    el.style.borderColor = '#d4af37'
    el.style.borderStyle = 'solid'
    el.style.borderWidth = '0px'
    
    if (corner.includes('top')) {
      el.style.top = '18px'
      el.style.borderTopWidth = '4px'
    } else {
      el.style.bottom = '18px'
      el.style.borderBottomWidth = '4px'
    }
    
    if (corner.includes('left')) {
      el.style.left = '18px'
      el.style.borderLeftWidth = '4px'
    } else {
      el.style.right = '18px'
      el.style.borderRightWidth = '4px'
    }
    goldBorder.appendChild(el)
  })

  // 1. Logo & Brand Name
  const brand = document.createElement('div')
  brand.style.fontSize = '14px'
  brand.style.fontWeight = '900'
  brand.style.letterSpacing = '0.3em'
  brand.style.color = '#4f46e5' // Indigo
  brand.style.fontFamily = "'Inter', sans-serif"
  brand.style.marginBottom = '20px'
  brand.style.textTransform = 'uppercase'
  brand.innerText = 'Nexora Academy'
  innerContainer.appendChild(brand)

  // 2. Title
  const certTitle = document.createElement('h1')
  certTitle.style.fontSize = '40px'
  certTitle.style.fontWeight = '800'
  certTitle.style.color = '#0f172a'
  certTitle.style.margin = '0 0 10px 0'
  certTitle.style.letterSpacing = '0.04em'
  certTitle.style.textTransform = 'uppercase'
  certTitle.innerText = 'Certificate of Competency'
  innerContainer.appendChild(certTitle)

  // 3. Subtitle / Statement
  const statement = document.createElement('p')
  statement.style.fontSize = '15px'
  statement.style.fontStyle = 'italic'
  statement.style.color = '#475569'
  statement.style.margin = '0 0 25px 0'
  statement.innerText = 'This official document is awarded to'
  innerContainer.appendChild(statement)

  // 4. Student Name
  const studentName = document.createElement('h2')
  studentName.style.fontSize = '36px'
  studentName.style.fontWeight = 'bold'
  studentName.style.color = '#4f46e5'
  studentName.style.margin = '0 0 20px 0'
  studentName.style.borderBottom = '2px solid rgba(212, 175, 55, 0.5)'
  studentName.style.paddingBottom = '8px'
  studentName.style.width = '70%'
  studentName.style.textAlign = 'center'
  studentName.innerText = name || 'Anonymous Candidate'
  innerContainer.appendChild(studentName)

  // 5. Completion Description
  const completionText = document.createElement('p')
  completionText.style.fontSize = '15px'
  completionText.style.color = '#334155'
  completionText.style.lineHeight = '1.7'
  completionText.style.width = '80%'
  completionText.style.textAlign = 'center'
  completionText.style.margin = '0 0 35px 0'
  
  const boldChallengeTitle = document.createElement('strong')
  boldChallengeTitle.style.color = '#0f172a'
  boldChallengeTitle.style.fontWeight = 'bold'
  boldChallengeTitle.innerText = ` "${title || 'Engineering Challenge'}" `

  const boldScore = document.createElement('strong')
  boldScore.style.color = '#10b981'
  boldScore.style.fontWeight = 'bold'
  boldScore.innerText = ` ${score || 0}/100 `

  completionText.innerText = 'for successfully satisfying all engineering requirements and scoring'
  completionText.appendChild(boldScore)
  completionText.appendChild(document.createTextNode('on the practical mock challenge:'))
  completionText.appendChild(document.createElement('br'))
  completionText.appendChild(boldChallengeTitle)
  innerContainer.appendChild(completionText)

  // 6. Signatures & Seal Section
  const footerRow = document.createElement('div')
  footerRow.style.width = '90%'
  footerRow.style.display = 'flex'
  footerRow.style.justifyContent = 'space-between'
  footerRow.style.alignItems = 'flex-end'
  footerRow.style.marginTop = '10px'

  // Left Signature Column
  const leftSigCol = document.createElement('div')
  leftSigCol.style.width = '240px'
  leftSigCol.style.textAlign = 'center'

  const leftSigText = document.createElement('div')
  leftSigText.style.fontFamily = "'Brush Script MT', 'cursive', 'Georgia'"
  leftSigText.style.fontSize = '24px'
  leftSigText.style.color = '#0f172a'
  leftSigText.style.marginBottom = '6px'
  leftSigText.style.fontStyle = 'italic'
  leftSigText.innerText = 'Nexora Board'
  leftSigCol.appendChild(leftSigText)

  const leftLine = document.createElement('div')
  leftLine.style.height = '1px'
  leftLine.style.background = '#cbd5e1'
  leftLine.style.marginBottom = '6px'
  leftSigCol.appendChild(leftLine)

  const leftRole = document.createElement('div')
  leftRole.style.fontSize = '11px'
  leftRole.style.fontWeight = '600'
  leftRole.style.color = '#94a3b8'
  leftRole.style.textTransform = 'uppercase'
  leftRole.style.letterSpacing = '0.05em'
  leftRole.innerText = 'Examination Committee'
  leftSigCol.appendChild(leftRole)
  footerRow.appendChild(leftSigCol)

  // Gold Seal / Medal
  const seal = document.createElement('div')
  seal.style.width = '70px'
  seal.style.height = '70px'
  seal.style.borderRadius = '50%'
  seal.style.background = 'linear-gradient(135deg, #f59e0b, #d97706)'
  seal.style.border = '4px solid #fff'
  seal.style.boxShadow = '0 0 10px rgba(212,175,55,0.4), 0 4px 6px rgba(0,0,0,0.1)'
  seal.style.display = 'flex'
  seal.style.alignItems = 'center'
  seal.style.justifyContent = 'center'
  seal.style.fontSize = '26px'
  seal.style.color = '#fff'
  seal.style.position = 'relative'
  seal.innerText = '★'

  // Ribbons hanging off the seal
  const ribbonL = document.createElement('div')
  ribbonL.style.position = 'absolute'
  ribbonL.style.bottom = '-20px'
  ribbonL.style.left = '12px'
  ribbonL.style.width = '16px'
  ribbonL.style.height = '35px'
  ribbonL.style.background = '#d97706'
  ribbonL.style.clipPath = 'polygon(0 0, 100% 0, 50% 100%)'
  ribbonL.style.zIndex = '-1'
  seal.appendChild(ribbonL)

  const ribbonR = document.createElement('div')
  ribbonR.style.position = 'absolute'
  ribbonR.style.bottom = '-20px'
  ribbonR.style.right = '12px'
  ribbonR.style.width = '16px'
  ribbonR.style.height = '35px'
  ribbonR.style.background = '#f59e0b'
  ribbonR.style.clipPath = 'polygon(0 0, 100% 0, 50% 100%)'
  ribbonR.style.zIndex = '-1'
  seal.appendChild(ribbonR)

  footerRow.appendChild(seal)

  // Right Signature Column
  const rightSigCol = document.createElement('div')
  rightSigCol.style.width = '240px'
  rightSigCol.style.textAlign = 'center'

  const rightSigText = document.createElement('div')
  rightSigText.style.fontFamily = "'Brush Script MT', 'cursive', 'Georgia'"
  rightSigText.style.fontSize = '24px'
  rightSigText.style.color = '#4f46e5'
  rightSigText.style.marginBottom = '6px'
  rightSigText.style.fontStyle = 'italic'
  rightSigText.innerText = 'AI Mentor Coach'
  rightSigCol.appendChild(rightSigText)

  const rightLine = document.createElement('div')
  rightLine.style.height = '1px'
  rightLine.style.background = '#cbd5e1'
  rightLine.style.marginBottom = '6px'
  rightSigCol.appendChild(rightLine)

  const rightRole = document.createElement('div')
  rightRole.style.fontSize = '11px'
  rightRole.style.fontWeight = '600'
  rightRole.style.color = '#94a3b8'
  rightRole.style.textTransform = 'uppercase'
  rightRole.style.letterSpacing = '0.05em'
  rightRole.innerText = 'AI Verification Engine'
  rightSigCol.appendChild(rightRole)
  footerRow.appendChild(rightSigCol)

  innerContainer.appendChild(footerRow)

  // 7. Security Hash & Date Footer
  const certFooter = document.createElement('div')
  certFooter.style.width = '90%'
  certFooter.style.display = 'flex'
  certFooter.style.justifyContent = 'space-between'
  certFooter.style.marginTop = '28px'
  certFooter.style.fontSize = '10px'
  certFooter.style.color = '#64748b'
  certFooter.style.fontFamily = "'Inter', sans-serif"

  const dateStr = date
    ? new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })

  certFooter.innerHTML = `
    <div>ISSUED: <strong>${dateStr}</strong></div>
    <div>CERTIFICATE ID: <strong style="letter-spacing: 0.05em; color: #4f46e5;">${id || 'NXR-VERIFIED-ID'}</strong></div>
  `
  innerContainer.appendChild(certFooter)

  container.appendChild(innerContainer)
  document.body.appendChild(container)

  try {
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#faf9f5',
      width: 1123,
      height: 794,
      windowWidth: 1123,
      windowHeight: 794,
      scrollX: 0,
      scrollY: 0,
      x: 0,
      y: 0
    })

    const imgData = canvas.toDataURL('image/png')
    
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    })

    pdf.addImage(imgData, 'PNG', 0, 0, 297, 210)
    pdf.save(`Nexora_Certificate_${id || 'verified'}.pdf`)
  } catch (err) {
    console.error('Failed to generate PDF:', err)
    alert('Failed to generate certificate. Please try again.')
  } finally {
    document.body.removeChild(container)
  }
}
