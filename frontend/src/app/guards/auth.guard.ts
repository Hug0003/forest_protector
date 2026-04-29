// src/app/guards/auth.guard.ts
import { Injectable } from '@angular/core';
import { 
  ActivatedRouteSnapshot, 
  CanActivate, 
  Router, 
  RouterStateSnapshot, 
  UrlTree 
} from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    
    const isAuthenticated = this.authService.isAuthenticated();
    
    console.log('🔐 AuthGuard - URL demandée:', state.url);
    console.log('🔐 AuthGuard - Authentifié:', isAuthenticated);
    
    if (isAuthenticated) {
      return true;
    }
    
    // Redirection vers login avec URL de retour
    console.log('⛔ Non authentifié, redirection vers /login');
    return this.router.createUrlTree(['/login'], {
      queryParams: { returnUrl: state.url }
    });
  }
}