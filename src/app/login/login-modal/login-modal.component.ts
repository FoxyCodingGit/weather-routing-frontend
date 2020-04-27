import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { first } from 'rxjs/operators';
import { AuthenticationService } from '../services/authentification.service';
import { AlertService } from 'src/app/shared/alert.service';
import { RoutingService } from 'src/app/shared/routing.service';

@Component({
  selector: 'app-login-modal',
  templateUrl: './login-modal.component.html',
  styleUrls: ['./login-modal.component.scss']
})
export class LoginModalComponent implements OnInit {
  loginForm: FormGroup;
  loading = false;
  submitted = false;
  returnUrl: string;

  constructor(
      private formBuilder: FormBuilder,
      private route: ActivatedRoute,
      private router: Router,
      private authenticationService: AuthenticationService,
      private alertService: AlertService,
      private routingService: RoutingService
  ) {
      // redirect to home if already logged in
      if (this.authenticationService.currentUserValue) {
          this.router.navigate(['/']);
      }
  }

  ngOnInit() {
      this.loginForm = this.formBuilder.group({
          username: ['', Validators.required],
          password: ['', [Validators.required, Validators.minLength(8), this.passwordHasAtLeastOneNumber]]
      });

      // get return url from route parameters or default to '/'
      this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
  }

  // convenience getter for easy access to form fields
  get f() { return this.loginForm.controls; }

  onSubmit() {
      this.submitted = true;

      // reset alerts on submit
      //this.alertService.clear();

      // stop here if form is invalid
      if (this.loginForm.invalid) {
          return;
      }

      this.loading = true;
      this.authenticationService.login(this.f.username.value, this.f.password.value)
          .pipe(first())
          .subscribe(
              data => {
                  //this.router.navigate([this.returnUrl]);
                  this.loading = false;
                  $('#loginModal').modal('hide');
                  this.routingService.applyUserDefinedRoutes();
              },
              error => {
                  this.alertService.error(error);
                  this.loading = false;
              });
  }

  passwordHasAtLeastOneNumber(control: AbstractControl) { // here we have the 'passwords' group
  let atLeastOneNum = new RegExp('.*[0-9].*');
  let password = control.value;

  return atLeastOneNum.test(password) ? null : { notAtLeastOneNumber: true };
}

  start() {
    $('#loginModal').modal();
  }
}
