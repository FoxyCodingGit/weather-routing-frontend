import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-icon-text',
  templateUrl: './icon-text.component.html',
  styleUrls: ['./icon-text.component.scss']
})
export class IconTextComponent {
  @Input() title: string;
  @Input() icons: string[];
  @Input() texts: Text[];
}
