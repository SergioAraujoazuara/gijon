/**
 * Component: Horta
 * 
 * Description:
 * This component embeds a Power BI report using an iframe.
 * It displays the report in a responsive centered container.
 * 
 * Key Features:
 * 1. **Embedded Power BI Report**:
 *    - The report is displayed using an iframe with specified dimensions.
 * 2. **Responsive Layout**:
 *    - The report is centered using Flexbox and occupies the full height of the screen.
 * 3. **Customizable iframe**:
 *    - The iframe includes attributes such as title, width, height, and allowFullScreen.
 * 
 * Flow:
 * - The iframe loads the Power BI report from a given URL.
 * - It is centered vertically and horizontally within the viewport.
 */



import React from 'react'

function Obaga() {
  return (
    <div className='flex justify-center min-h-screen'>

<iframe title="Auscultación Llacuna" width="1400" height="800.5" src="https://app.powerbi.com/view?r=eyJrIjoiOWU3Y2U2MzYtMGQxNy00YThhLTkwN2UtMzQ4MmEzY2NiMGY3IiwidCI6IjI0ZmMyMTgyLThhYmQtNGY2YS1hY2QyLTU1ODNhMjI2MGZiYSIsImMiOjl9" frameborder="0" allowFullScreen="true"></iframe>

 
</div>
  )
}

export default Obaga