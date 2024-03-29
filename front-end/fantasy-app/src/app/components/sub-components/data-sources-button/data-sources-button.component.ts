import { OnInit, Component, Input } from "@angular/core";
import { SimpleTextModalComponent } from "../simple-text-modal/simple-text-modal.component";
import { ConfigService } from "src/app/services/init/config.service";
import { MatDialog } from "@angular/material/dialog";

@Component({
    selector: 'data-sources-button',
    templateUrl: './data-sources-button.component.html',
    styleUrls: ['./data-sources-button.component.css']
})
export class DataSourcesButtonComponent implements OnInit {

    constructor(private configService: ConfigService,
        private dialog: MatDialog) {

    }

    ngOnInit(): void {
    }

    /**
     * Open how to play modal
     */
    openDataSourcesModal(): void {
        this.configService.loadDocumentation('data_sources').subscribe(data => {
            this.dialog.open(SimpleTextModalComponent
                , {
                    minHeight: '350px',
                    minWidth: this.configService.isMobile ? '200px' : '500px',
                    data: {
                        headerText: 'About our Data Sources',
                        categoryList: data
                    }
                }
            );
        });
    }
}
