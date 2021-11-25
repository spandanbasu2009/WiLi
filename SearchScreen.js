import React from "react"
import {Text,View,ScrollView} from "react-native"
import db from "../config.js"
import firebase from "firebase"
export default class SearchScreen extends React.Component{
    constructor(props){
        super(props)
        this.state = {
            allTransactions: []
        }
    }
    componentDidMount = async() => {
        const query = await db.collection("transactions").get()
        query.docs.map((doc) => {
          this.setState({
              allTransactions: [...this.state.allTransactions, doc.data()]
          })
        })
    }
    render(){
        return(

            <ScrollView>{this.state.allTransactions.map((item,index) => {
                return(
                    <View key = {index}><Text>{item.transactionType}</Text>
                    <Text>{item.bookId}</Text>
                    <Text>{item.studentId}</Text>
                    <Text>{item.date.toDate()}</Text>
                    </View>
                    
                    
                )
            })}</ScrollView>
        )
    }
}