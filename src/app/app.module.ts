import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { NavbarComponent } from './navbar/navbar.component';
import { MapComponent } from './map/map.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { ChartsModule } from 'ng2-charts';
import { GraphComponent } from './graph/graph.component';
import { RouteDataTableComponent } from './route-data-table/route-data-table.component';
import { RouteCreationComponent } from './route-creation/route-creation.component';
import { ModalComponent } from './modal/modal.component';
import { AlertComponent } from './alert/alert.component';
import { IconTextComponent } from './icon-text/icon-text.component';
import { LoginModalComponent } from './login/login-modal/login-modal.component';
import { ElevationInfoComponent } from './elevation-info/elevation-info.component';

@NgModule({
  declarations: [
    AppComponent,
    NavbarComponent,
    MapComponent,
    GraphComponent,
    RouteDataTableComponent,
    RouteCreationComponent,
    ModalComponent,
    AlertComponent,
    IconTextComponent,
    LoginModalComponent,
    ElevationInfoComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    ChartsModule
  ],
  providers: [], // Do i need to put services here?
  bootstrap: [AppComponent]
})
export class AppModule { }
