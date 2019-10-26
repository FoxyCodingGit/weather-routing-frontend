import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { NavbarComponent } from './navbar/navbar.component';
import { MapComponent } from './map/map.component';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { ChartsModule } from 'ng2-charts';
import { GraphComponent } from './graph/graph.component';
import { RouteDataTableComponent } from './route-data-table/route-data-table.component';

@NgModule({
  declarations: [
    AppComponent,
    NavbarComponent,
    MapComponent,
    GraphComponent,
    RouteDataTableComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    HttpClientModule,
    ChartsModule
  ],
  providers: [], // Do i need to put services here?
  bootstrap: [AppComponent]
})
export class AppModule { }
