import type { RGBA, SyntaxStyle, TreeSitterClient } from '@opentui/core'
/// <reference types="solid-js" />
import type { JSX as SolidJSX } from 'solid-js'

// Color type that accepts string or RGBA
type Color = string | RGBA

// Extend Solid's IntrinsicElements with OpenTUI custom elements
declare module 'solid-js' {
  namespace JSX {
    interface IntrinsicElements {
      // Box element - flex container
      box: {
        children?: SolidJSX.Element | SolidJSX.Element[]
        flexDirection?: 'row' | 'column'
        flexGrow?: number
        flexShrink?: number
        flexBasis?: number | string
        alignItems?: 'flex-start' | 'flex-end' | 'center' | 'stretch'
        justifyContent?:
          | 'flex-start'
          | 'flex-end'
          | 'center'
          | 'space-between'
          | 'space-around'
          | 'space-evenly'
        gap?: number
        width?: number | string
        height?: number | string
        minWidth?: number | string
        minHeight?: number | string
        maxWidth?: number | string
        maxHeight?: number | string
        padding?: number
        paddingTop?: number
        paddingBottom?: number
        paddingLeft?: number
        paddingRight?: number
        margin?: number
        marginTop?: number
        marginBottom?: number
        marginLeft?: number
        marginRight?: number
        border?: ('top' | 'bottom' | 'left' | 'right')[]
        borderColor?: Color
        backgroundColor?: Color
        position?: 'relative' | 'absolute'
        top?: number
        bottom?: number
        left?: number
        right?: number
      }

      // Text element - text rendering
      text: {
        children?: SolidJSX.Element | SolidJSX.Element[] | string | number | (string | number)[]
        fg?: Color
        bg?: Color
        attributes?: number
        width?: number
        flexGrow?: number
      }

      // Scrollbox element - scrollable container
      scrollbox: {
        children?: SolidJSX.Element | SolidJSX.Element[]
        scrollX?: boolean
        scrollY?: boolean
        stickyScroll?: boolean
        stickyStart?: 'top' | 'bottom'
        flexGrow?: number
        contentOptions?: {
          paddingLeft?: number
          paddingRight?: number
          paddingTop?: number
          paddingBottom?: number
          gap?: number
          flexGrow?: number
        }
      }

      // Code element - syntax highlighted code
      code: {
        children?: SolidJSX.Element | SolidJSX.Element[]
        content?: string
        filetype?: string
        syntaxStyle?: SyntaxStyle
        treeSitterClient?: TreeSitterClient
      }

      // Diff element - unified diff display
      diff: {
        children?: SolidJSX.Element | SolidJSX.Element[]
        diff?: string
        view?: 'unified' | 'split'
        filetype?: string
        syntaxStyle?: SyntaxStyle
        treeSitterClient?: TreeSitterClient
      }
    }
  }
}

export {}
