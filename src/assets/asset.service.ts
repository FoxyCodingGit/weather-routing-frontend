import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AssetService { // service may be overkill?
  public startMarkerUrl = "/assets/images/start-marker.png"
  public focusedStartMarkerFile = "http://maps.google.com/mapfiles/ms/icons/purple-dot.png";
  public focusedEndMarkerFile = "http://maps.google.com/mapfiles/ms/icons/yellow-dot.png";
}
