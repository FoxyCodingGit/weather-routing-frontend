import { Component, OnInit } from "@angular/core";
import { Router, ActivatedRoute } from "@angular/router";
import {
  FormBuilder,
  FormGroup,
  Validators,
  AbstractControl,
} from "@angular/forms";
import { first } from "rxjs/operators";
import { AuthenticationService } from "../services/authentification.service";
import { AlertService } from "src/app/shared/alert.service";
import { RoutingService } from "src/app/shared/routing.service";

@Component({
  selector: "app-login-modal",
  templateUrl: "./login-modal.component.html",
  styleUrls: ["./login-modal.component.scss"],
})
export class LoginModalComponent implements OnInit {
  loginForm: FormGroup;
  loading = false;
  submitted = false;
  returnUrl: string;

  public registerUserOnSubmit = false;

  constructor(
    private formBuilder: FormBuilder,
    private authenticationService: AuthenticationService,
    private alertService: AlertService,
    private routingService: RoutingService
  ) { }

  ngOnInit() {
    this.loginForm = this.formBuilder.group({
      username: ['', Validators.required],
      password: ['', [Validators.required, Validators.minLength(8), this.passwordHasAtLeastOneNumber]],
    });
  }

  get formControls() {
    return this.loginForm.controls;
  }

  onSubmit() {
    this.submitted = true;

    if (this.loginForm.invalid) {
      return;
    }

    this.loading = true;

    if (this.registerUserOnSubmit) {
      this.authenticationService
        .register(this.formControls.username.value, this.formControls.password.value)
        .pipe(first())
        .subscribe(
          (data) => {
            this.loginPerformed();
          },
          (error) => {
            this.alertService.error(error);
            this.loading = false;
          }
        );
    } else {
      this.authenticationService
        .login(this.formControls.username.value, this.formControls.password.value)
        .pipe(first())
        .subscribe(
          (data) => {
            this.loginPerformed();
          },
          (error) => {
            this.alertService.error(error);
            this.loading = false;
          }
        );
    }
  }

  public passwordHasAtLeastOneNumber(control: AbstractControl) {
    let atLeastOneNum = new RegExp('.*[0-9].*');
    let password = control.value;

    return atLeastOneNum.test(password) ? null : { notAtLeastOneNumber: true };
  }

  private loginPerformed() {
    $('#loginModal').modal('hide');
    this.routingService.applyUserDefinedRoutes();
    this.loading = false;
    this.clearModal();
  }

  private clearModal() {
    this.loginForm.reset();
    this.submitted = false;
    this.registerUserOnSubmit = false;

    for (let name of Object.keys(this.loginForm.controls)) {
        this.formControls[name].setErrors(null);
    }
  }

  start() {
    $('#loginModal').modal();
  }
}
