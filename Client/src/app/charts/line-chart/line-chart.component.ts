import { Component, OnInit } from "@angular/core";
import { LINE_CHART_COLORS } from "../../shared/chart.colors";
import { SalesDataService } from 'src/app/services/sales-data.service';
import _ from "lodash";
import * as moment from "node_modules/moment";

const THEME = "Bright";

@Component({
  selector: "app-line-chart",
  templateUrl: "./line-chart.component.html",
  styleUrls: ["./line-chart.component.css"]
})
export class LineChartComponent implements OnInit {
  constructor(private _salesDataService: SalesDataService) {}

  topCustomers: string[];
  allOrders: any[];

  public lineChartData;
  public lineChartLabels;
  public lineChartOptions: any = {
    responsive: true,
    maintainAspectRatio: false
  };
  public lineChartLegend: true;
  public lineChartType: string = "line";
  public lineChartColors = LINE_CHART_COLORS;

  ngOnInit() {
    this._salesDataService.getOrders(1, 100).subscribe(res => {
      this.allOrders = res["page"]["data"];
      this._salesDataService.getOrdersByCustomer(3).subscribe(cus => {
        
        this.topCustomers = _.map(cus, x => x["name"]);
        
        const allChartData = this.topCustomers.reduce((result, i) => {
          result.push(this.getChartData(this.allOrders, i));
          return result;
        }, []);
        
        let dates = allChartData.map(x => x["data"]).reduce((a, i) => {          
          a.push(i.map(o => new Date(o[0])));
          return a;
        }, []);

        dates = [].concat.apply([], dates);

        const r = this.getCustomerOrdersByDate(allChartData, dates)["data"];
        console.log(r);
        this.lineChartLabels = r[0]["orders"].map(o => o["date"]);
        this.lineChartData = [
          { "data": r[0].orders.map(x => x.total), "label": r[0]["customer"]},
          { "data": r[1].orders.map(x => x.total), "label": r[1]["customer"]},
          { "data": r[2].orders.map(x => x.total), "label": r[2]["customer"]},
        ];
      });
    });
  }
  getChartData(allOrders: any, name: string) {
    
    const customerOrders = allOrders.filter(o => o.customer.name === name);

    const formattedOrders = customerOrders.reduce((r, e) => {
      r.push([e.placed, e.total]);
      return r;
    },[]);
    const result = {customer: name, data: formattedOrders};
    return result;
  }
  getCustomerOrdersByDate(orders: any, dates: any) {
    const customers = this.topCustomers;
    const prettyDates = dates.map(x => this.toFriendlyDate(x));
    const u = Array.from(new Set(prettyDates)).sort();
    const result = {};
    const dataSets = result["data"] = []

    customers.reduce((x, y, i) => {
      const customerOrders = [];
      dataSets[i] = {
        customer: y, 
        orders: u.reduce((r, e, j) => {
          const obj = {};
          obj["date"] = e;
          obj["total"] = this.getCustomerDateTotal(e, y); // Sum total orders for customer on that day
          customerOrders.push(obj);
          return customerOrders;
        }, [])};
      return x;
    }, []);
    return result;
  }
  toFriendlyDate(date: Date) {
    return moment(date).endOf("day").format("YY-MM-DD");
  }
  getCustomerDateTotal(date: any, customer: any){
    const r = this.allOrders.filter(o => o.customer.name === customer 
      && this.toFriendlyDate(o.placed)=== date);

    const result = r.reduce((a, b) => {
      return a + b.total;
    }, 0)

    return result;
  }

}
