type Route = {
  name: string
  path: string
  meta?: {
    tab: boolean
  }
  redirect?: {
    name: string
  }
}

export type Routes = Route[]

export type Resolved = {
  name?: string
  path: string
  fullPath: string
  params?: object
  query?: object
  meta?: {
    tab: boolean
  }
}

export type CurrentRoute = {
  name?: string
  path?: string
  query?: object
}
