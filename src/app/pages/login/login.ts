import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  private readonly REMEMBER_KEY = 'remembered_email';

  readonly loading = signal(false);
  readonly errorMessage = signal('');
  readonly showPassword = signal(false);

  readonly form = this.fb.nonNullable.group({
    email: [this.getRememberedEmail(), [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    rememberMe: [!!this.getRememberedEmail()],
  });

  get email() { return this.form.controls.email; }
  get password() { return this.form.controls.password; }

  togglePassword(): void {
    this.showPassword.update((v) => !v);
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    if (this.loading()) return;

    const { email, password, rememberMe } = this.form.getRawValue();
    this.loading.set(true);
    this.errorMessage.set('');

    this.auth.login({ email, password }).subscribe({
      next: () => {
        this.handleRemember(email, rememberMe);
        const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') || '/dashboard';
        this.router.navigateByUrl(returnUrl);
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMessage.set(err?.error?.message ?? 'Something went wrong. Please try again.');
      },
    });
  }

  private handleRemember(email: string, remember: boolean): void {
    try {
      remember
        ? localStorage.setItem(this.REMEMBER_KEY, email)
        : localStorage.removeItem(this.REMEMBER_KEY);
    } catch { /* ignore */ }
  }

  private getRememberedEmail(): string {
    try { return localStorage.getItem(this.REMEMBER_KEY) ?? ''; } catch { return ''; }
  }
}