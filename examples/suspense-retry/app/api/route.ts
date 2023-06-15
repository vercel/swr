import { NextResponse } from 'next/server'

export const GET = () => {
  return Math.random() < 0.5
    ? NextResponse.json({
        data: 'success'
      })
    : new Response('Bad', {
        status: 500
      })
}
