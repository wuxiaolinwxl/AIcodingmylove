import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { UrlSigner } from './url-signer';

const UPLOAD_PREFIX = '/uploads/';

@Injectable()
export class SignUrlInterceptor implements NestInterceptor {
  constructor(private signer: UrlSigner) {}

  intercept(ctx: ExecutionContext, next: CallHandler): Observable<any> {
    const req = ctx.switchToHttp().getRequest();
    const userId: number | undefined = req?.user?.userId;
    if (!userId) return next.handle();

    return next.handle().pipe(map((data) => this.rewrite(data, userId)));
  }

  private rewrite(value: any, userId: number): any {
    if (value == null) return value;
    if (typeof value === 'string') return this.signIfUploadPath(value, userId);
    if (Array.isArray(value)) return value.map((v) => this.rewrite(v, userId));
    if (typeof value === 'object') {
      for (const k of Object.keys(value)) {
        value[k] = this.rewrite(value[k], userId);
      }
      return value;
    }
    return value;
  }

  private signIfUploadPath(s: string, userId: number): string {
    if (!s.startsWith(UPLOAD_PREFIX)) return s;
    const pathAndQuery = s.slice(UPLOAD_PREFIX.length);
    const qIdx = pathAndQuery.indexOf('?');
    const key = qIdx >= 0 ? pathAndQuery.slice(0, qIdx) : pathAndQuery;
    if (!key || key.includes('..')) return s;
    return this.signer.sign(key, userId);
  }
}
