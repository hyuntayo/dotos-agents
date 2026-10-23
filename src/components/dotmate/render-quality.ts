const MAX_PIXELS=1_250_000

/** Account for the hero's CSS enlargement while bounding the WebGL fill cost. */
export function modelPixelRatio(width:number,height:number,deviceRatio:number){
  return Math.min(Math.max(1,deviceRatio||1)*1.35,2.5,Math.sqrt(MAX_PIXELS/(Math.max(1,width)*Math.max(1,height))))
}
