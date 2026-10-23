import type {BodyKind,ColorKey} from './sprites'

export function mateRenderUrl(body:BodyKind,color:ColorKey){
  return `/models/renders/hd-v1/${body}-${color}-450.webp`
}
export function mateRenderFullUrl(body:BodyKind,color:ColorKey){
  return `/models/renders/hd-v1/${body}-${color}.webp`
}
export function mateRenderProps(body:BodyKind,color:ColorKey,sizes:string){
  const base=`/models/renders/hd-v1/${body}-${color}`
  return {src:mateRenderUrl(body,color),srcSet:`${base}-450.webp 450w, ${base}-900.webp 900w, ${base}.webp 1350w`,sizes}
}
