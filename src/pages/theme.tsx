import { type NextPage } from 'next'
import dynamic from 'next/dynamic'
import { MantineNavbar } from '~/components/MantineNavbar'

const ActionToggle = dynamic(() => import('../components/ThemeToggle'), {
  ssr: false
})

const PageWithThemeToggle: NextPage = () => {
  return (
    <MantineNavbar>
      <ActionToggle />
    </MantineNavbar>
  )
}

export default PageWithThemeToggle
