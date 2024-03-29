import { NgxSliderModule } from "@angular-slider/ngx-slider";
import { DragDropModule } from "@angular/cdk/drag-drop";
import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { FlexLayoutModule } from "@angular/flex-layout";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { MatBadgeModule } from "@angular/material/badge";
import { MatButtonModule } from "@angular/material/button";
import { MatButtonToggleModule } from "@angular/material/button-toggle";
import { MatCardModule } from "@angular/material/card";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { MatChipsModule } from "@angular/material/chips";
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from "@angular/material/dialog";
import { MatDividerModule } from "@angular/material/divider";
import { MatExpansionModule } from "@angular/material/expansion";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatIconModule } from "@angular/material/icon";
import { MatInputModule } from "@angular/material/input";
import { MatListModule } from "@angular/material/list";
import { MatMenuModule } from "@angular/material/menu";
import { MatPaginatorModule } from "@angular/material/paginator";
import { MatProgressBarModule } from "@angular/material/progress-bar";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { MatRadioModule } from "@angular/material/radio";
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSelectModule } from "@angular/material/select";
import { MatSidenavModule } from "@angular/material/sidenav";
import { MatSlideToggleModule } from "@angular/material/slide-toggle";
import { MatSliderModule } from "@angular/material/slider";
import { MatSortModule } from "@angular/material/sort";
import { MatTableModule } from "@angular/material/table";
import { MatTabsModule } from "@angular/material/tabs";
import { MatToolbarModule } from "@angular/material/toolbar";
import { MatTooltipModule } from "@angular/material/tooltip";
import { MatCarouselModule } from "@thouet/material-carousel";
import { QueryBuilderModule } from "angular2-query-builder";
import { ChartsModule } from "ng2-charts";
import { NgxMatSelectSearchModule } from "ngx-mat-select-search";
import { DraftToolbarComponent } from "src/app/components/draft/draft-toolbar/draft-toolbar.component";
import { CreatePresetModalComponent } from "src/app/components/modals/create-preset-modal/create-preset-modal.component";
import { AffiliateBannerComponent } from "src/app/components/sub-components/affiliate-banner/affiliate-banner.component";
import { DataSourcesButtonComponent } from "src/app/components/sub-components/data-sources-button/data-sources-button.component";
import { FantasyMarketDropdownComponent } from "src/app/components/sub-components/fantasy-market-dropdown/fantasy-market-dropdown.component";
import { LeagueDropdownComponent } from "src/app/components/sub-components/league-dropdown/league-dropdown.component";
import { LoginErrorComponent } from "src/app/components/sub-components/login-error/login-error.component";
import { ShareSocialsComponent } from "src/app/components/sub-components/share-socials/share-socials.component";
import { SimpleTextModalComponent } from "src/app/components/sub-components/simple-text-modal/simple-text-modal.component";
import { ToolHelpComponent } from "src/app/components/sub-components/tool-help/tool-help.component";
import { TradeDatabaseCardComponent } from "src/app/components/trade-database/trade-database-card/trade-database-card.component";
import { AccentNumberPipe } from "src/app/pipes/accentNumber.pipe";
import { HighLightSearchPipe } from "src/app/pipes/high-light-search.pipe";
import { TruncatePipe } from "src/app/pipes/truncate.pipe";

const MODULES = [
  CommonModule,
  FlexLayoutModule,
  MatToolbarModule,
  MatIconModule,
  MatButtonModule,
  MatTableModule,
  MatSidenavModule,
  MatListModule,
  MatExpansionModule,
  MatPaginatorModule,
  MatSortModule,
  MatBadgeModule,
  NgxMatSelectSearchModule,
  FormsModule,
  MatFormFieldModule,
  MatInputModule,
  MatSelectModule,
  MatDividerModule,
  MatMenuModule,
  MatButtonToggleModule,
  MatSlideToggleModule,
  MatCheckboxModule,
  MatTabsModule,
  ChartsModule,
  MatChipsModule,
  MatDialogModule,
  DragDropModule,
  MatTooltipModule,
  MatCardModule,
  MatRadioModule,
  QueryBuilderModule,
  ReactiveFormsModule,
  NgxSliderModule,
  MatSliderModule,
  MatProgressSpinnerModule,
  MatProgressBarModule,
  MatDatepickerModule,
  MatNativeDateModule,
  MatCarouselModule,
];

const DECLARATIONS = [
  AffiliateBannerComponent,
  ToolHelpComponent,
  CreatePresetModalComponent,
  TradeDatabaseCardComponent,
  DataSourcesButtonComponent,
  FantasyMarketDropdownComponent,
  LoginErrorComponent,
  SimpleTextModalComponent,
  TruncatePipe,
  HighLightSearchPipe,
  LeagueDropdownComponent,
  AccentNumberPipe,
  ShareSocialsComponent,
  DraftToolbarComponent,
]

@NgModule({
  providers: [
    { provide: MatDialogRef, useValue: {} },
    { provide: MAT_DIALOG_DATA, useValue: {} }
  ],
  imports: [
    ...MODULES
  ],
  declarations: [
    ...DECLARATIONS
  ],
  exports: [
    ...MODULES,
    ...DECLARATIONS
  ]
})
export class SharedModule {
}
