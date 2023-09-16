import { ActionIcon, Group } from '@mantine/core'
import { IconSun, IconMoonStars } from '@tabler/icons-react'
import { useColorScheme } from '../ColorSchemeContext'
import { type FC } from 'react'

const ActionToggle: FC = () => {
  const { colorScheme, toggle, active } = useColorScheme()

  return (
    <Group position="center" my="xl">
      <ActionIcon
        onClick={(e) => {
          if (!active) {
            console.log(e.clientX, e.clientY, e)

            void toggle(e.clientX, e.clientY)
          }
        }}
        size="lg"
        sx={(theme) => ({
          backgroundColor:
            theme.colorScheme === 'dark'
              ? theme.colors.dark[6]
              : theme.colors.gray[0],
          color:
            theme.colorScheme === 'dark'
              ? theme.colors.yellow[4]
              : theme.colors.blue[6]
        })}
      >
        {colorScheme === 'dark' ? (
          <IconSun size="1.2rem" />
        ) : (
          <IconMoonStars size="1.2rem" />
        )}
      </ActionIcon>
    </Group>
  )
}

export default ActionToggle
