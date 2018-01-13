# 2017-web-development-project-Joelande94
### Link to try it out is at the bottom

1. Create a portfolio
    1. User can create a portfolio [Check]
    2. (s)he must enter the portfolio name [Check]
2. Remove a portfolio
    1. User can delete a portfolio [Check]
3. View portfolio
    1. Usermust be able to change the currency between US dollar and Euro [Not unchecked but not checked either]
    2. (s)he must be able to view the current values of the stocks in the portfolio [Because of the same problem as before you will only see the value as it was when the stock was added to the portfolio]
    3. (s)he must be able to view the total value of the portfolio [Check]
4. Compare stock value performances in a portfolio
    1. Usermust be able to see a graph showing the historic valuation of the stocks [Check]
    2. s(he) must be able to adjust thetime window of the graph by selecting the starting and ending date of the graph [Check]
5. Add stock
    1. User must enter the symbol of the stock [Check]
    2. (s)he must enter the total number of stocks [Check]
6. Remove stock
    1. User can remove stocks from a portfolio [Check]

* You need to use the persistence local storage to save all data related to the created portfolios. [Check]

* The maximum number of portfolios that can be created is 10 [Check]

* The maximum number of symbol (different stocks) in a portfolio is 50 [Check]

* There is no limit on the number of stocks a portfolio can contain [Check]

* Currency exchange rates, stock prices and historical prices are available via the following API: https://www.alphavantage.co/documentation/

* You need to request a free API key to use the service

* You need to find a library able to generate the graphs(google will be your friend for this) [react-linechart]


## Problems I had:
I could not get the inside of the table to update the stocks shown. For each table row I display the following:
```
return(<tr>
            <td><div className="after">{this.state.name.toUpperCase()}</div></td>
            <td><div className="after">{this.state.unit_value}</div></td>
            <td><div className="after">{this.state.quantity}</div></td>
            <td><div className="after">{this.state.total_value}</div></td>
            <td><div className="after"><input type='checkbox' onChange={this.onChange.bind(this)} checked=  {this.state.selected} value={this.key}/></div></td>
       </tr>
);
```
and with the help of console prints I have been able to determine that the information for changing the currency does indeed take effect up until it's being rendered in the portfolio component. This means I create new `Stock`'s that contain the above shown render function and the correct values and I confirm that with a console.log before they are passed down into the render function of the portfolio AND INSIDE the render function. However, in the Stock render function I also console.log out the values of the ones that ARE in fact being drawn and they have the wrong values... 


# [Finally, here's the link to the project to try it out](https://it-teaching-abo-akademi.github.io/2017-web-development-project-Joelande94)
