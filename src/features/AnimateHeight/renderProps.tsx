import * as React from 'react'
import {
  StyledLargeMaterialIcon,
  StyledButtonWrap,
  StyledButton,
} from './styled'
import { RenderTriggerProps } from './typings'

export function defaultRenderTrigger(props: RenderTriggerProps) {
  const { isExpanded, onClick } = props
  const text = isExpanded ? 'hide' : 'show'
  const icon = isExpanded ? 'up_arrow' : 'down_arrow'
  return (
    <StyledButtonWrap key="wrap" title="show/hide skills">
      <StyledButton onClick={onClick} key="toggle">
        <StyledLargeMaterialIcon icon={icon as any} title={text} />
      </StyledButton>
    </StyledButtonWrap>
  )
}
