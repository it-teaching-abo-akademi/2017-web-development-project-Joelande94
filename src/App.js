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

//HOLY SPIRIT OF REACT -> INFORMATION FLOWS UP. NEVER FETCH. <- Lawyer up, delete facebook, hit the gym.

/**Todo list
 * Make it reacty (Store everything as great big giant JSON which apparently is very smart and clever according to react)
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
 * ** Specifications ** *
 * Todo make it reacty
 * In App:
 *      portfolios is to be a JSON object of all portfolios
 *      Any changes made in each portfolio triggers callBack function of App with the new JSON portfolio (id/key will be used for identification)
 *
 * In Portfolio:
 *      stocks is to be a JSON object of all stocks in this portfolio
 *      Any changes made in each stock triggers callBack function of Portfolio with the new JSON stock stocks[id] = newStock
 *
 * Thoughts:
 *      When recreating page from localStorage: when creating a portfolio, pass info of stocks down when creating it and move on to next portfolio
 *      In constructor of portfolio and portfolio's "this" exists, you can then pass the functions you need to create the stocks.
 *
 * Todo dun did [NOT FOR REACTY THOUGH :,( ]
 * Add portfolio
 * Add stock
 * Total value is currently NaN€ instead of 0€*
 * Remove selected stock. [Idea: whenever checkbox is changed call callback function from portfolio to add/remove
 *                         it from a list. Then if remove selected is pressed, remove all stocks with keys in the list.]
 * Remove portfolio
 *
 */





class App extends Component {
    constructor(props){
        super(props);
        let portfolios = [];
        let jsPortfolios = {};
        /*
        if(storageAvailable("localStorage")){
            //Check if there are any juicy localstorage portfolios
            if(localStorage.portfolios !== undefined){
                let temp = JSON.parse(localStorage.portfolios);
                Object.keys(temp).forEach(function(key){
                    let portfolio = <Portfolio key={(temp[key].key)} name={(temp[key]['props'].name)}/>;
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
        */
        this.state = {
            portfolios: portfolios,
            jsPortfolios: jsPortfolios
        }
    }
    updateLocalStorage(){
        //This will probably be useless after Reactyfying
        console.log("Saving to local storage");
        let jsPortfolios = this.state.jsPortfolios;
        localStorage.portfolios = jsPortfolios;
    }

    deletePortfolio(key){
        //Delete the portfolio whose [X] button was just clicked.
        let state = this.state;
        let jsPortfolios = this.state.jsPortfolios;
        delete jsPortfolios[key];
        state.jsPortfolios = jsPortfolios;
        this.setState(state);
    }

    updatePortfolio(portfolio){
        let state = this.state;
        state.jsPortfolios[portfolio.id] = portfolio;
        this.setState(state);
    }

    addPortfolio(){
        var name = prompt("Pick a name for the portfolio.");
        if(name === null || name.trim() === ""){
            alert("The name cannot be empty.");
        }else{
            //Get current list of portfolios, push this new portfolio to it and update the state and local storage.
            let portfolios = this.state.portfolios;
            let state = this.state;
            let id = guid();
            portfolios.push(<Portfolio key={id} id={id} name={name} updatePortfolio={this.updatePortfolio.bind(this)} deletePortfolio={this.deletePortfolio.bind(this)}/>);
            state.portfolios = portfolios;
            this.setState(state);
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
    updatePortfolio = undefined;
    deleteThis = undefined;
    constructor(props){
        super(props);
        this.deleteThis = this.props.deletePortfolio;
        this.updatePortfolio = this.props.updatePortfolio;
        let jsStocks = {};
        this.state = {
            currency: currency,
            id: this.props.id,
            jsStocks: jsStocks,
            total_value: 0.0,
            selected: []
        };
    }

    addStock(){
        //This function takes the input and tries to fetch the data of that stock symbol.
        let input = prompt("Enter the stock's symbol and how many you have. e.g. \"MSFT, 10\"");
        let symbol = "";
        let quantity = 0;
        if(input === null || input.trim() === ""){
            //alert("The symbol cannot be empty.");
            input = ("MSFT, 13").split(",");
            symbol = input[0].trim();
            quantity = input[1].trim();
        }else {
            let splitInput = input.split(",");
            if(splitInput[0].trim() === input.trim()){
                symbol = splitInput.trim();
                quantity = 1;
            }else{
                symbol = splitInput[0].trim();
                quantity = splitInput[1].trim();
            }
        }
        try{
            parseFloat(quantity);
            getStockData(this.addStock2.bind(this), symbol, quantity);
        }catch(e){
            alert("That's not a valid input");
        }
    }
    addStock2(jsonObj, quantity){
        //The callback function of the request.
        //This is where the stock is actually created.
        console.log("Got the data!");
        if(Object.keys(jsonObj)[0] === "Error Message"){
            alert("Could not find a stock with that symbol. Double check and try again.");
        }else{
            let state = this.state;
            let name = Object.values(jsonObj['Meta Data'])[1]; //The symbol
            let firstVal = Object.values(jsonObj['Time Series (1min)'])[0]; //First row of the time series
            let latestClose = firstVal['4. close']; //The close value of the first row (most recent)
            let oldValue = state.total_value;
            let id = guid();
            let newTotalValue = (parseFloat(oldValue) + parseFloat(latestClose)*parseFloat(quantity)).toFixed(2);

            //Reacty part. The <Stock /> still needs to be created but only when showing.
            let jsStocks = state.jsStocks;
            jsStocks[id] = {
                id: id,
                name: name,
                unit_value: latestClose,
                quantity: quantity
            };
            state.jsStocks = jsStocks;
            this.setState(jsStocks);
            //Since we now changed this Portfolio we need to pass the information up!
            //TODO pass the information up!
            //callBackFunction();
            //end of Reacty part.
            this.updateToShow();
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
        this.setState(state);
        this.updateToShow();
    }
    updateStocks(stocks, newTotalValue){
        console.log("1Setting total value to: ", newTotalValue);
        let state = this.state;
        state.stocks = stocks;
        state.total_value = newTotalValue;

        this.setState(state);
        this.updateToShow();
    }
    updateToShow(){
        let stocks = this.state.jsStocks;
        let totalValue = this.getTotalValue(stocks);
        let showStocks = [];
        let getcurr = this.getCurrency.bind(this);
        let updateSelected = this.setSelected.bind(this);
        if(this.state.currency === "euro"){
            totalValue = (totalValue * euroValue).toFixed(2);
            Object.keys(stocks).forEach(function(key){
                let stock = stocks[key];
                let id = stock.id;
                showStocks.push(<Stock
                    updateSelected={updateSelected}
                    getcurrency={getcurr}
                    key={id}
                    id={id}
                    name={stock.name}
                    unit_value={(stock.unit_value*euroValue).toFixed(2)}
                    quantity={stock.quantity} />);
            });
            console.log("showing as euros");
        }else{
            totalValue = totalValue.toFixed(2);
            Object.keys(stocks).forEach(function(key){
                let stock = stocks[key];
                let id = stock.id;
                showStocks.push(<Stock
                    updateSelected={updateSelected}
                    getcurrency={getcurr}
                    key={id}
                    id={id}
                    name={stock.name}
                    unit_value={(parseFloat(stock.unit_value)).toFixed(2)}
                    quantity={stock.quantity} />);
            });
            console.log("showing as dollars");
            console.log("Update to show totalValue: " + totalValue);
        }
        //Update state
        let state = this.state;
        state.showStocks = showStocks;
        state.total_value = totalValue;
        this.setState(state);

        //Since this is the last stop for all modifying functions in this class we pass the change up at this point.
        this.passItUp();
    }

    /**
     * Call this whenever a change occurs to pass that info up so the big boss is aware of it.
     */
    passItUp(){
        let state = this.state;
        let save = {
            id: state.id,
            currency: state.currency,
            stocks: state.stocks,
            total_value: state.total_value,
        }
        this.updatePortfolio(save);
    }
    getCurrency(){
        console.log("getCurrency");
        return this.state.currency;
    }
    getTotalValue(){
        console.log("Getting total value");
        let totalValue = 0;
        let stocks = this.state.jsStocks;
        Object.keys(stocks).forEach(function(key){
            let current = stocks[key];
            totalValue += parseFloat(current.quantity)*parseFloat(current.unit_value);
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
        let jsStocks = this.state.jsStocks;
        let selected = this.state.selected;
        selected.forEach(function(key){
            //Reacty part
            delete jsStocks[key];
        });
        this.updateStocks(jsStocks, this.getTotalValue(jsStocks));
    }
    render() {
        let currencySymbol = dollarSymbol;
        if(this.state.currency === "euro"){
            currencySymbol = euroSymbol;
        }
        console.log("Drawing showstocks: ");
        console.log(this.state.showStocks);
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
                            Total value: <label className="totalPortfolioValue">{this.state.total_value}{currencySymbol}</label>
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
                <td>{this.state.name.toUpperCase()}</td>
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
