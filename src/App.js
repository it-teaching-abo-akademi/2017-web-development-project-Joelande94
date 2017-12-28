import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';

/*Own imports*/
import sort_logo from './updown_arrow.png';

let API_KEY = "CXOK71OQTSO3FIY7";
let currency = "euro";
let euroSymbol = "€";
let dollarSymbol = "$";
let euroValue = undefined;
let test = undefined;
getEuroValue();

/**Todo list
 * Currency switcher doesn't work inside the table. Only on total value.
 * Store in local storage.
 * Performance graph. (Prompt which interval when clicking it? Radio buttons for intervals?
 *      Straight up fetch daily, weekly, monthly, yearly or all time from API.)
 * Sorting
 * Make the buttons appear in the right positions
 * Currently stock value is only fetched once and stays the same.
 *      ("Easy" fix: Whenever value is updated, remove old <Stock /> and create new <Stock /> with the new value).
 *
 * Todo for sanity
 * Fix the fucking stocks/showStocks situation...
 *      Option 1: Change the list that you show instead of creating new list to show when euros.
 *      Option 2: First only store the stocks as a JSON list. Then when you show them make them <Stock />
 *
 * Todo bonus
 * Enable cryptos.
 * Slide portfolio up and leave only bar to be able to slide it down again.
 *
 * Todo dun did
 * Total value is currently NaN€ instead of 0€*
 * Remove selected stock. [Idea: whenever checkbox is changed call callback function from portfolio to add/remove
 *                         it from a list. Then if remove selected is pressed, remove all stocks with keys in the list.]
 */



class App extends Component {
    constructor(props){
        super(props);
        let portfolios = [];
        if(storageAvailable("localStorage")){
            //Check if there are any juicy localstorage portfolios
            if(localStorage.portfolios !== undefined){
                let temp = JSON.parse(localStorage.portfolios);
                Object.keys(temp).forEach(function(key){
                    let portfolio = <Portfolio key={(temp[key].key)} name={(temp[key]['props'].name)} callback={this.updateLocalStorage.bind(this)}/>;
                    let stocks = temp[key]['stocks'];
                    portfolios.push(portfolio);
                }.bind(this));
                console.log("Found existing list in local storage");
                console.log(portfolios);
            }else{
                //If there is no "portfolios" in local storage, put the empty list there
                localStorage.portfolios = JSON.stringify(portfolios);
                console.log("Putting empty list in local storage");
                console.log(localStorage.portfolios);
            }
        }else{
            alert("Yo browsa so old, she don't even support local storage.");
        }
        this.state = {
            portfolios: portfolios
        }
    }
    updateLocalStorage(){
        console.log("Update local storage");
        console.log(JSON.stringify(this.props.children));
        /*
        localStorage.clear();
        console.log("Update local storage");
        console.log(this.state.portfolios);
        let portfolios = this.state.portfolios;

        //localStorage.portfolios = JSON.stringify(portfolios);
        //let lsPortfolios = JSON.parse(localStorage.portfolios);
        //console.log(lsPortfolios);

        //Need to turn portfolios into json objects myself I think and then import them in reverse.

        //Iterate over each stock in portfolios stocks
        let toLocalStorage = {};
        portfolios.forEach(function(reactObject){
            console.log("reactObject.props:");
            console.log(reactObject);
            let stocks = [];
            reactObject.props.stocks.forEach(function(stock){
                let toLSstock = {key: stock.key,
                                name: stock.name,
                                unit_value: stock.unit_value,
                                quantity: stock.unit_value
                                };
                stocks.add(toLSstock);
                console.log(toLSstock);

            });
            //newStocks.push(<Stock symbol={name} unit_value={unit_value} quantity={quantity}/>);
            //localStorage.portfolios['specific'].stocks = JSON.stringify(newStocks);
            toLocalStorage.key = {key: reactObject.props.key,
                                name: reactObject.props.name,
                                stocks: stocks};
        });
        */
    }

    deletePortfolio(key){
        //Delete the portfolio whose [X] was just clicked. The portfolio has the key that's provided.
        let portfolios = this.state.portfolios;
        portfolios.forEach(function(portfolio){
            if(portfolio.key === key){
                let index = portfolios.indexOf(portfolio);
                portfolios.splice(index, 1);
            }
        });
        this.updatePortfolios(portfolios);
    }
    updatePortfolios(portfolios){
        this.setState({
            portfolios: portfolios
        });
    }


    addPortfolio(e){
        var name = prompt("Pick a name for the portfolio.");
        if(name === null || name.trim() === ""){
            alert("The name cannot be empty.");
        }else{
            //Get current list of portfolios, push this new portfolio to it and update the state and local storage.
            let portfolios = this.state.portfolios;
            portfolios.push(<Portfolio key={guid()} name={name} callback={this.updateLocalStorage.bind(this)} deletePortfolio={this.deletePortfolio.bind(this)}/>);
            this.updatePortfolios(portfolios);
            this.updateLocalStorage();
        }
    }
    render() {
        return (
        <div className="App">
            <div className="Header">
                <Button function={this.addPortfolio.bind(this)} className="AddPortfolioButton" label="Add portfolio"/>
            </div>
            <div className="Portfolio_container col-11 col-m-11">
                {this.state.portfolios}
            </div>
        </div>
        );
    }
}
class Portfolio extends Component {
    saveChange = undefined;
    deleteThis = undefined;
    constructor(props){
        super(props);
        this.saveChange = this.props.callback;
        this.deleteThis = this.props.deletePortfolio;
        this.stocks = [];
        this.state = {
            currency: currency,
            key: this.key,
            stocks: this.stocks,
            totalValue: 0.0,
            selected: []
        };
        this.saveChange();
    }
    getStocks(){
        return this.state.stocks;
    }
    addStock(){
        //This function takes the input and tries to fetch the data of that stock symbol.
        let input = prompt("Enter the stock's symbol and how many you have. e.g. \"MSFT, 10\"");
        //input = "MSFT, 13".split(",");
        if(input === null || input.trim() === ""){
            //alert("The symbol cannot be empty.");
            input = ("MSFT, 13").split(",");
        }else {
            input = input.split(",");
        }
        getStockData(this.addStock2.bind(this), input[0].trim(), input[1].trim());
    }
    addStock2(jsonObj, quantity){
        //The callback function of the request.
        //This is where the stock is actually created.
        console.log("Got the data!");
        if(Object.keys(jsonObj)[0] === "Error Message"){
            alert("Could not find a stock with that symbol. Double check and try again.");
        }else{
            let name = Object.values(jsonObj['Meta Data'])[1]; //The symbol
            let firstVal = Object.values(jsonObj['Time Series (1min)'])[0]; //First row of the time series
            let latestClose = firstVal['4. close']; //The close value of the first row (most recent)
            let oldValue = this.state.totalValue;
            let stocks = this.state.stocks;
            let id = guid();
            let stock = <Stock key={id} id={id} name={name} unit_value={latestClose} quantity={quantity} />;
            let newTotalValue = (parseFloat(oldValue) + parseFloat(latestClose)*parseFloat(quantity)).toFixed(2);

            stocks.push(stock);
            this.updateStocks(stocks, newTotalValue);
            this.saveChange();
        }
    }
    perfGraph(){
        console.log("Show performance graph!");
    }
    deletePortfolio(){
        let input = prompt("Are you sure you want to delete this portfolio (y/n)?");
        if(input.toLowerCase() === "y"){
            this.deleteThis(this._reactInternalFiber.key);
        }
    }
    showEuro(){
        this.updateCurrency("euro");
    }
    showDollar(){
        this.updateCurrency("dollar");
    }
    updateCurrency(currency){
        let state = this.state;
        state.currency = currency;
        this.setState(state)
        this.updateToShow();
    }
    updateStocks(stocks, newTotalValue){
        console.log("1Setting total value to: ", newTotalValue);
        let state = this.state;
        state.stocks = stocks;
        state.totalValue = newTotalValue;

        this.setState(state);
        this.updateToShow();
    }
    updateToShow(){
        let stocks = this.state.stocks;
        let totalValue = this.getTotalValue(stocks);
        console.log("Update to show totalValue: " + totalValue);
        let showStocks = [];
        let getcurr = this.getCurrency.bind(this);
        let updateSelected = this.setSelected.bind(this);
        if(this.state.currency === "euro"){
            totalValue = (totalValue * euroValue).toFixed(2);
            //This is really REALLY ugly but I had to change it half-way and it was the only way I could make it work (fast enough).
            //I never actually show the first <Stock />s I make, I only show these new ones. :(
            stocks.forEach(function(stock){
                let id = stock.key;
                showStocks.push(<Stock
                    updateSelected={updateSelected}
                    getcurrency={getcurr}
                    key={id}
                    id={id}
                    name={stock.props.name}
                    unit_value={(stock.props.unit_value*euroValue).toFixed(2)}
                    quantity={stock.props.quantity} />);
            });
            console.log("showing as euros");
        }else{
            totalValue = totalValue.toFixed(2);
            showStocks = stocks;
            console.log("showing as dollars");
        }
        //Update state
        let state = this.state;
        state.showStocks = showStocks;
        state.totalValue = totalValue;
        this.setState(state);
    }
    getCurrency(){
        console.log("getCurrency");
        return this.state.currency;
    }
    getTotalValue(stocks){
        console.log("Getting total value");
        let totalValue = 0;
        stocks.forEach(function(stock){
            totalValue += parseFloat(stock.props.quantity)*parseFloat(stock.props.unit_value);
            console.log(totalValue);
        });
        return totalValue;
    }
    //Changes list of selected stocks.
    setSelected(key, bool){
        console.log("Change in selected!");
        let state = this.state;
        let selected = this.state.selected;
        if(bool){
            //The stock with this key is now selected
            //Add it to the list
            selected.push(key);
            state.selected = selected;
            this.setState(state);
        }else{
            //The stock with this key is now unselected
            //Remove it from the list
            let index = selected.indexOf(key);
            selected.splice(index, 1);
            state.selected = selected;
            this.setState(state);
        }
        console.log(this.state.selected);
    }
    //Removes all stocks that are in the list of selected stocks
    removeSelected(){
        console.log("Removing stock!");
        let stocks = this.state.stocks;
        let selected = this.state.selected;
        selected.forEach(function(key){
            stocks.forEach(function(stock){
                if(stock.props.id === key){
                    stocks.splice(stocks.indexOf(stock), 1);
                }
            });
        });
        this.updateStocks(stocks, this.getTotalValue(stocks));
        this.saveChange();
    }
    render() {
        let currencySymbol = dollarSymbol;
        if(this.state.currency === "euro"){
            currencySymbol = euroSymbol;
        }
        return (
            <div className="Portfolio col- col-5 col-m-11">
                <div className="Portfolio-inner">
                    <div className="Portfolio-header">
                        <span   className="Portfolio-title col- col-5 col-m-11">{this.props.name}</span>
                        <Button function={this.showDollar.bind(this)}      className="Portfolio-header-showEuro"     label="Show in $"/>
                        <Button function={this.showEuro.bind(this)}        className="Portfolio-header-showDollar"   label="Show in €"/>
                        <Button function={this.deletePortfolio.bind(this)} className="Portfolio-header-deleteButton" label="X"/>
                    </div>
                    <div className="Portfolio-content">
                        <table>
                            <thead>
                            <tr>
                                <th><div className="Table-label">
                                    Symbol
                                </div></th>
                                <th><div className="Table-label">
                                    Unit value
                                </div></th>
                                <th><div className="Table-label">
                                    Quantity
                                </div></th>
                                <th><div className="Table-label">
                                    Total value
                                </div></th>
                                <th><div className="Table-label">
                                    Select
                                </div></th>
                            </tr>
                            </thead>
                            <tbody>
                                {this.state.showStocks}
                            </tbody>
                        </table>
                    </div>
                    <div className="Portfolio-footer">
                        <p>
                            Total value: <label className="totalPortfolioValue">{this.state.totalValue}{currencySymbol}</label>
                        </p>
                        <Button function={this.addStock.bind(this)} className="Portfolio-footer-addStockButton" label="Add stock"/>
                        <Button function={this.perfGraph.bind(this)} className="Portfolio-footer-perfGraphButton" label="Perf. graph"/>
                        <Button function={this.removeSelected.bind(this)} className="Portfolio-footer-removeStockButton" label="Remove selected"/>
                    </div>
                </div>
            </div>
        );
    }
}

class Stock extends Component{
    constructor(props){
        super(props);
        this.state = {
            id: this.props.id,
            updateSelected: this.props.updateSelected,
            getcurrency: this.props.getcurrency,
            name: this.props.name,
            unit_value: this.props.unit_value,
            quantity: this.props.quantity,
            total_value: parseFloat(this.props.unit_value)*parseFloat(this.props.quantity),
            selected: false
        };
    }
    onChange(e){
        console.log("onChosen!");
        console.log(e.target.value);
        this.setState({
            selected: e.target.checked
        });
        console.log("Sending key: " + this.state.id + " and boolean: " + !this.state.selected + " to updateSelected in portfolio!");
        //Send key of this stock to portfolio to be added to list
        if(!this.state.selected){
            this.state.updateSelected(this.state.id, true);
        }else{
            this.state.updateSelected(this.state.id, false);
        }
    }
    render(){
        //Draw each table row
        console.log("This is in render in stock");
        //console.log(this.state.getcurrency());
        return(
            <tr>
                <td>{this.state.name}</td>
                <td>{this.state.unit_value}</td>
                <td>{this.state.quantity}</td>
                <td>{this.state.total_value.toFixed(2)}</td>
                <td><input type='checkbox' onChange={this.onChange.bind(this)} checked={this.state.selected} value={this.key}/></td>
            </tr>
        );
    }
}

/**
 * A custom button
 */
class Button extends Component {
    constructor(props){
        super(props);
        this.state = {
            function: props.function
        };
    }
    handleClick(e){
        this.state.function(e);
    }
    render(){
        return (
            <button className="btn" key={guid()} value={this.props.value} onClick={this.handleClick.bind(this)}>
                {this.props.label}
            </button>
        );
    }
}

/**
 * An image that you can click
 */
class ClickableImage extends Component{
    render(){
        return(
            <img className="ClickableImage" src={this.props.src}/>
        );
    }
}

/**
 * Get stock data from alphavantage API
 * @param callback: the function to return the data to.
 * @param symbol: the symbol of the stock
 * @param quantity: the quantity of the stock. Needed in the callback function when adding stocks.
 */
function getStockData(callback, symbol, quantity){
    let url = "https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY&symbol="+symbol+"&interval=1min&apikey="+API_KEY;
    console.log("Doing API request with url:" + url);
    xhttpRequest(callback, url, quantity);
}

/**
 *
 * @param callback
 * @param file
 * @param rememberThis
 */
function xhttpRequest(callback, file, rememberThis){
    var rawFile = new XMLHttpRequest();
    rawFile.open("GET", file, true);
    rawFile.onreadystatechange = function (){
        if(this.readyState === 4 && this.status === 200){
            var jsonObj = JSON.parse(this.responseText);
            if(rememberThis != null){
                callback(jsonObj, rememberThis);
            }else{
                callback(jsonObj);
            }
        }
        if(this.status === 404){
            error(404, file);
        }
    }
    rawFile.send();
}

function error(status, file){
    alert("Could not get " + file + "\n 404, file not found.");
}

/**
 * Used to update update the euroValue variable.
 * Automatically called when page is loaded.
 * Can be used after that if needed as well.
 */
function getEuroValue(){
    let url = "https://www.alphavantage.co/query?function=CURRENCY_EXCHANGE_RATE&from_currency=USD&to_currency=EUR&apikey="+API_KEY;
    xhttpRequest(setEuroValue, url, null);
}

/**
 * Never call this directly.
 * Gets called automatically by getEuroValue().
 */
function setEuroValue(jsonObj){
    console.log("Set euro value");
    euroValue = jsonObj["Realtime Currency Exchange Rate"]["5. Exchange Rate"];
}

//Generates unique ID
function guid() {
    function s4() {
        return Math.floor((1 + Math.random()) * 0x10000)
            .toString(16)
            .substring(1);
    }
    return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
        s4() + '-' + s4() + s4() + s4();
}

//Check for localStorage
function storageAvailable(type) {
    try {
        var storage = window[type],
            x = '__storage_test__';
        storage.setItem(x, x);
        storage.removeItem(x);
        return true;
    }
    catch(e) {
        return e instanceof DOMException && (
                // everything except Firefox
            e.code === 22 ||
            // Firefox
            e.code === 1014 ||
            // test name field too, because code might not be present
            // everything except Firefox
            e.name === 'QuotaExceededError' ||
            // Firefox
            e.name === 'NS_ERROR_DOM_QUOTA_REACHED') &&
            // acknowledge QuotaExceededError only if there's something already stored
            storage.length !== 0;
    }
}
export default App;
