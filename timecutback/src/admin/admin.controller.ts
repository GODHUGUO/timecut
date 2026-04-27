import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { AdminAuthGuard } from '../auth/admin-auth.guard';
import { AdminService } from './admin.service';

@Controller('admin')
@UseGuards(AdminAuthGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('dashboard/stats')
  getDashboardStats() {
    return this.adminService.getDashboardStats();
  }

  @Get('users')
  getUsers(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('plan') plan?: string,
  ) {
    return this.adminService.getUsers(
      parseInt(page || '1', 10),
      parseInt(limit || '20', 10),
      search,
      plan,
    );
  }

  @Get('users/stats')
  getUsersStats() {
    return this.adminService.getUsersStats();
  }

  @Get('users/top')
  getTopUsers() {
    return this.adminService.getTopUsers();
  }

  @Get('payments')
  getPayments(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
  ) {
    return this.adminService.getPayments(
      parseInt(page || '1', 10),
      parseInt(limit || '20', 10),
      status,
    );
  }

  @Get('payments/stats')
  getPaymentsStats() {
    return this.adminService.getPaymentsStats();
  }

  @Get('payments/recent')
  getRecentPayments() {
    return this.adminService.getRecentPayments();
  }

  @Post('verify-password')
  async verifyAdminPassword(@Body() body: { password: string }) {
    return this.adminService.verifyAdminPassword(body.password);
  }
}
