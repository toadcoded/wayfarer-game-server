/** Bounded per-address fixed windows. New addresses fail closed when full. */
export class RequestLimits {
  constructor({limit=300,windowMs=60000,maxKeys=4096,now=()=>Date.now()}={}) {
    this.limit=limit;this.windowMs=windowMs;this.maxKeys=maxKeys;this.now=now;this.keys=new Map();
  }
  allow(key) {
    const now=this.now(); let row=this.keys.get(key);
    if (row && now-row.start>=this.windowMs) {this.keys.delete(key);row=undefined;}
    if (!row) {
      if (this.keys.size>=this.maxKeys) for(const [k,v] of this.keys) if(now-v.start>=this.windowMs)this.keys.delete(k);
      if (this.keys.size>=this.maxKeys) return false;
      row={start:now,count:0};this.keys.set(key,row);
    }
    return ++row.count<=this.limit;
  }
}
export function requestAddress(req,trustProxy=false) {
  const forwarded=req.headers['x-forwarded-for'];
  return trustProxy && typeof forwarded==='string' ? forwarded.split(',').at(-1).trim().slice(0,128) : req.socket.remoteAddress??'unknown';
}
