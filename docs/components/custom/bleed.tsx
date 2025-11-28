import { cn } from '@/lib/utils'
import type { ComponentProps } from 'react'

type BleedProps = ComponentProps<'div'> & {
  full?: boolean
}

export const Bleed = ({ full, className, ...props }: BleedProps) => {
  return (
    <div
      className={cn(
        'nextra-bleed x:relative x:-mx-4 x:mt-[1.25em] x:md:-mx-8 x:2xl:-mx-24',
        'x:z-1', // for firefox https://github.com/shuding/nextra/issues/2824
        full && [
          // 'md:mx:[calc(-50vw+50%+8rem)',
          'x:xl:me-[calc(50%-50vw)] x:xl:ms-[calc(50%-50vw+16rem)]'
        ],
        className
      )}
      {...props}
    />
  )
}
