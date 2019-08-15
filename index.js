import React from 'react'
import ReactDOM from 'react-dom'
import { BrowserRouter as Router, Route } from 'react-router-dom'
import './styles/index.scss'

class App extends React.Component{
    render(){
      return (
        <div>
          <pre>      .-``'.  📻                            📻  .'''-.</pre>
          <pre>    .`   .`       ~ O R B I T   W A V E S ~      `.   '.</pre>
          <pre>_.-'     '._ <a href="https://github.com/orbitdb/web3-workshop/">github.com/orbitdb/web3-workshop/</a> _.'     '-._</pre>
          <Router>
            <Route exact path="/" component={(props) => <div></div> }/>
          </Router>
        </div>
      )
    }
}

ReactDOM.render(<App />, document.getElementById('root'))
