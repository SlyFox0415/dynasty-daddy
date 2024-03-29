import { Component, OnInit, Input } from '@angular/core';
import { LeagueService } from 'src/app/services/league.service';
import { LeagueSwitchService } from '../../services/league-switch.service';
import { Router } from '@angular/router';
import { UserService } from 'src/app/services/user.service';

@Component({
  selector: 'app-login-error',
  templateUrl: './login-error.component.html',
  styleUrls: ['./login-error.component.css']
})
export class LoginErrorComponent implements OnInit {

  @Input()
  errorHeader = 'Please select a league.';

  constructor(public leagueService: LeagueService,
    public userService: UserService,
    private router: Router,
    public leagueSwitchService: LeagueSwitchService) {

  }

  ngOnInit() {

  }

  openUrl(): void {
    this.router.navigate(['/home']);
  }
}