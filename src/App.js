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

getEuroValue();

class App extends Component {
    constructor(props){
        super(props);
        let portfolios = [];
        if(storageAvailable("localStorage")){
            //Check if there's some juicy localstorage history
            if(localStorage.portfolios !== undefined){
                let temp = JSON.parse(localStorage.portfolios);
                Object.keys(temp).forEach(function(key){
                    let portfolio = <Portfolio key={(temp[key]['props'].key)} name={(temp[key]['props'].name)} callback={this.updateLocalStorage.bind(this)}/>;
                    let stocks = temp[key]['stocks'];
                    portfolios.push(portfolio);
                }.bind(this));
                console.log("Found existing list in local storage");
                console.log(portfolios);
            }else{
                //If there is no history in local storage, put the empty list there
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
        console.log(this.props.children);
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
        console.log("Deleting " + key);
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
            totalValue: 0.0
        };
        this.saveChange();
    }
    getStocks(){
        return this.state.stocks;
    }
    addStock(stock){
        let input = prompt("Enter the stock's symbol and how many you have. e.g. \"MSFT, 10\"");
        //input = "MSFT, 13".split(",");
        if(input === null || input.trim() === ""){
            //alert("The symbol cannot be empty.");
            input = ("MSFT, 13").split(",");
        }else {
            input = input.split(",");
        }
        getStockData(this.addStock2.bind(this), input[0].trim(), input[1].trim());
        /*
        this.stocks = this.state.stocks;
        this.stocks.push(stock);
        const oldState = this.state;
        this.setState({
            stocks: this.stocks,
            totalValue: parseFloat(oldState.totalValue) + parseFloat(stock.unit_value)*parseFloat(stock.quantity)
        });
        this.saveChange();
        */
    }
    addStock2(jsonObj, quantity){
        console.log("Got the data!");
        console.log(jsonObj);
        let name = Object.values(jsonObj['Meta Data'])[1];
        let firstVal = Object.values(jsonObj['Time Series (1min)'])[0];
        let latestClose = firstVal['4. close'];
        let oldValue = this.state.totalValue;
        let stocks = this.state.stocks;
        let stock = <Stock key={guid()} name={name} unit_value={latestClose} quantity={quantity} />;
        let newTotalValue = (parseFloat(oldValue) + parseFloat(latestClose)*parseFloat(quantity)).toFixed(2);
        //console.log("benis");
        //console.log(oldValue);
        //console.log(stock.unit_value);
        //console.log(stock.quantity);

        stocks.push(stock);
        this.setState({
            currency: this.state.currency,
            stocks: this.stocks,
            totalValue: newTotalValue
        });
        this.saveChange();
    }
    removeSelected(e){
        console.log("Removing!");
        let oldState = this.state;
        let stocks = oldState.stocks;
        console.log(stocks);
        let oldValue = oldState.totalValue;
        for(let i=0; i<stocks.length; i++){
            console.log(stocks[i].selected);
            if(stocks[i].selected) {
                console.log("Found selected: " + stocks[i].key);
                stocks.splice(i, 1);
                this.setState({
                    stocks: stocks,
                    totalValue: oldValue - parseFloat(stocks[i].total_value)
                });
            }
        }
        this.saveChange();
    }
    perfGraph(){
        console.log("Show performance graph!");
    }
    deletePortfolio(){
        this.deleteThis(this.state.key);
    }
    showEuro(){
        this.updateCurrency("euro");
    }
    showDollar(){
        this.updateCurrency("dollar");
    }
    updateCurrency(currency){
        let oldState = this.state;
        let newState = {
            currency: currency,
            stocks: oldState.stocks,
            totalValue: oldState.totalValue
        }
        this.setState(newState);
    }

    render() {
        let totalValue = parseFloat(this.state.totalValue).toFixed(2);
        let currencySymbol = dollarSymbol;
        let stocks = this.state.stocks;
        let showStocks = [];
        if(this.state.currency === "euro"){
            totalValue = (totalValue * euroValue).toFixed(2);
            currencySymbol = euroSymbol;
            stocks.forEach(function(stock){
                console.log("stock");
                console.log(stock);
                showStocks.push(<Stock key={stock.key} name={stock.props.name} unit_value={(stock.props.unit_value*euroValue).toFixed(2)} quantity={stock.props.quantity} />)
            });

        }else{
            currencySymbol = dollarSymbol;
            showStocks = stocks;
        }
        console.log("Gonna show this now");
        console.log(showStocks);
        return (
            <div className="Portfolio col- col-5 col-m-11">
                <div className="Portfolio-inner">
                    <div className="Portfolio-header">
                        <span   className="Portfolio-title col- col-5 col-m-11">{this.props.name}</span>
                        <Button function={this.showEuro.bind(this)} className="Portfolio-header-showEuro" label="Show in $"/>
                        <Button function={this.showDollar.bind(this)} className="Portfolio-header-showDollar" label="Show in €"/>
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
                            {showStocks}
                            </tbody>
                        </table>
                    </div>
                    <div className="Portfolio-footer">
                        <p>
                            Total value: <label className="totalPortfolioValue">{totalValue}{currencySymbol}</label>
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
            key: this.key,
            name: this.props.name,
            unit_value: this.props.unit_value,
            quantity: this.props.quantity,
            total_value: parseFloat(this.props.unit_value)*parseFloat(this.props.quantity),
            selected: false
        };
    }
    onChosen(e){
        console.log("onChosen!");
        console.log(e.target.value);
        this.setState({
            selected: e.target.checked
        });
    }
    render(){
        const category = this.props.category;
        return(
            <tr>
                <td>{this.state.name}</td>
                <td>{this.state.unit_value}</td>
                <td>{this.state.quantity}</td>
                <td>{this.state.total_value.toFixed(2)}</td>
                <td><input type='checkbox' onChange={this.onChosen.bind(this)} checked={this.state.selected} value={this.state.key}/></td>
            </tr>
        );
    }
}

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
class ClickableImage extends Component{
    render(){
        return(
            <img className="ClickableImage" src={this.props.src}/>
        );
    }
}

//Get stock data from alphavantage API
function getStockData(callback, symbol, quantity){
    let url = "https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY&symbol="+symbol+"&interval=1min&apikey="+API_KEY;
    console.log("Doing API request with url:" + url);
    xhttpRequest(callback, url, quantity);
}

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

function getEuroValue(){
    let url = "https://www.alphavantage.co/query?function=CURRENCY_EXCHANGE_RATE&from_currency=USD&to_currency=EUR&apikey="+API_KEY;
    xhttpRequest(setEuroValue, url, null);
}
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
