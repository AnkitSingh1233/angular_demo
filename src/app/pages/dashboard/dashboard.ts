import { Component, computed, inject } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard {
  readonly auth = inject(AuthService);

  readonly initials = computed(() => {
    const name = this.auth.user()?.name ?? 'U';
    return name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();
  });

  logout(): void {
    this.auth.logout(); // session clear + /login par redirect
  }
}