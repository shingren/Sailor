package com.sailor.dto;

public class DashboardResumenDTO {
    private Double todayTotalSales;
    private Integer openTablesCount;
    private Integer pendingOrdersCount;

    public DashboardResumenDTO() {
    }

    public DashboardResumenDTO(Double todayTotalSales, Integer openTablesCount, Integer pendingOrdersCount) {
        this.todayTotalSales = todayTotalSales;
        this.openTablesCount = openTablesCount;
        this.pendingOrdersCount = pendingOrdersCount;
    }

    public Double getTodayTotalSales() {
        return todayTotalSales;
    }

    public void setTodayTotalSales(Double todayTotalSales) {
        this.todayTotalSales = todayTotalSales;
    }

    public Integer getOpenTablesCount() {
        return openTablesCount;
    }

    public void setOpenTablesCount(Integer openTablesCount) {
        this.openTablesCount = openTablesCount;
    }

    public Integer getPendingOrdersCount() {
        return pendingOrdersCount;
    }

    public void setPendingOrdersCount(Integer pendingOrdersCount) {
        this.pendingOrdersCount = pendingOrdersCount;
    }
}
