import { Component, Input } from '@angular/core';
import { IconTextThings } from './Models/IconTextThings';

@Component({
  selector: 'app-icon-text',
  templateUrl: './icon-text.component.html',
  styleUrls: ['./icon-text.component.scss']
})
export class IconTextComponent {
  @Input() thing: IconTextThings;
}
