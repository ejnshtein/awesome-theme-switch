import { type AppType } from 'next/app'
import dynamic from 'next/dynamic'
import { api } from '~/utils/api'
import '~/styles/globals.css'

const ColorSchemeProvider = dynamic(
  () => import('../components/ColorSchemeContext'),
  {
    ssr: false
  }
)

const MyApp: AppType = ({ Component, pageProps }) => {
  return (
    <ColorSchemeProvider>
      <Component {...pageProps} />
    </ColorSchemeProvider>
  )
}

export default api.withTRPC(MyApp)
