import { prismaClient } from 'db/client'
import { NextResponse } from 'next/server'

export const POST = async (req: Request) => {
  try {
    await prismaClient.user.create({
      data: {}
    })
    return NextResponse.json({ message: 'Success' }, { status: 200 })
  } catch (error) {
    return NextResponse.json({ message: 'Error' }, { status: 500 })
  } finally {
    await prismaClient.$disconnect()
  }
}
