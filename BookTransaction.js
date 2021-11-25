import React from "react"
import {Text,View,TouchableOpacity,StyleSheet,TextInput, Image, KeyboardAvoidingView, ToastAndroid, Alert} from "react-native"
import {BarCodeScanner} from "expo-barcode-scanner"
import * as Permissions from "expo-permissions"
import db from "../config"
import * as firebase from "firebase"
export default class BookTransaction extends React.Component{
    constructor(){
        super();
        this.state = {
            hasCameraPermissions: null,
            scanned: false,
            scannedBookID: "",
            scannedStudentId: "",
            buttonState: "normal",
            transactionMsg: ""
        }
    }

    getCameraPermissions = async(id) => {
        const{status} = await Permissions.askAsync(Permissions.CAMERA)
        this.setState({
            hasCameraPermissions: status === "granted",
            buttonState: id
        })
    }
    handleBarCodeScanner = async({type,data}) => {
        const {buttonState} = this.state
        if(buttonState === "Book_ID"){
        this.setState({
            scannedBookID: data,
            scanned: true,
            buttonState: "normal"
        })
    }else if(buttonState === "Student_ID"){
        this.setState({
            scannedStudentId: data,
            scanned: true,
            buttonState: "normal"
        })
    } 
    }
    handleTransaction = async() => {
        console.log(this.state.scannedBookID,this.state.scannedStudentId)
        if(this.state.scannedBookID && this.state.scannedStudentId){
        var transactionMsg;
        var transactionType = await this.checkAvailability()

        if(! transactionType){
            Alert.alert("THIS BOOK DOES NOT EXIST IN THE DATABASE..")
            this.setState({
                scannedBookID: "",
                scannedStudentId: ""
            })
            
        }else if(transactionType==="issue"){
            var isStudentEligible = await this.checkEligibilityForIssue()
            if(isStudentEligible){
                this.initiateBookIssue()
                Alert.alert("BOOK ISSUED BY STUDENT..")
                this.setState({
                    scannedBookID: "",
                    scannedStudentId: ""
                })
            }
        }else{
            var isStudentEligible = await this.checkEligibilityForReturn()
            this.initiateBookReturn()
            Alert.alert("BOOK RETURNED..")
            
                this.setState({
                    scannedBookID: "",
                    scannedStudentId: ""
                })
        }
    }else{
        Alert.alert("enter BOTH book id and student id!!")
    }
        // db.collection("books").doc(this.state.scannedBookID).get().then((doc) => {
        //     console.log(doc.data())
        //     var book = doc.data()
        //     if(book.bookAvailability){
        //       this.initiateBookIssue()
        //       transactionMsg = "BOOK ISSUED"
        //     }
        //     else{
        //         this.initiateBookReturn()
        //         transactionMsg = "BOOK RETURNED"
        //     }
        //     this.setState({
        //         transactionMsg: transactionMsg
        //     })
        //     ToastAndroid.show(transactionMsg, ToastAndroid.SHORT)
        // })
    }
    checkEligibilityForIssue = async() => {
        const studentRef = db.collection("students").where("studentId","==",this.state.scannedStudentId).get()
        var isStudentEligible = ""
        if(studentRef.docs.length===0){
            this.setState({
                scannedBookID: "",
                scannedStudentId: ""
            })
            Alert.alert("STUDENT ID DOES NOT EXIST..")
            isStudentEligible = false
        }else{
             studentRef.docs.map((doc) => {
                 var student = doc.data()
                 if(student.numberOfBooksIssued < 2){
                     isStudentEligible = true
                 }else{
                     isStudentEligible = false
                     Alert.alert("THE STUDENT HAS ALREADY ISSUED 2 BOOKS..")
                     this.setState({
                        scannedBookID: "",
                        scannedStudentId: ""
                    })
                 }
             })
        }
        return isStudentEligible
    }
    checkEligibilityForReturn = async() => {
        const transactionRef = await db.collection("transactions").where("bookId","==",this.state.scannedBookID).limit(1).get()
        var isStudentEligible = ""
        if(transactionRef.docs.length===0){
            isStudentEligible = false
                Alert.alert("THIS BOOK WAS NOT ISSUED BY THIS STUDENT..")
                this.setState({
                    scannedBookID: "",
                    scannedStudentId: ""
                })
        }else{
        transactionRef.docs.map((doc) => {
            var lastBookTransaction = doc.data()
            if(lastBookTransaction.studentId === this.state.scannedBookID){
              isStudentEligible = true
            }else{
                isStudentEligible = false
                Alert.alert("THIS BOOK WAS NOT ISSUED BY THIS STUDENT..")
                this.setState({
                    scannedBookID: "",
                    scannedStudentId: ""
                })

            }
        })
    }
        return isStudentEligible
    }
    checkAvailability=async() => {
        const bookRef = await db.collection("books").where("bookId","==",this.state.scannedBookId).get()
        var transactionType= ""
        if(bookRef.docs.length === 0){
            transactionType = false
        }else{
            bookRef.docs.map((doc) => {
                var book = doc.data()
                if(book.bookAvailability){
                      transactionType = "issue"
                      Alert.alert("issue")
                }else{
                    transactionType = "return"
                }
            })
        }
        return transactionType
    }
    initiateBookIssue = async() => {
        db.collection("transactions").add({
            studentId: this.state.scannedStudentId,
            bookId: this.state.scannedBookID,
            date: firebase.firestore.Timestamp.now().toDate(),
            transactionType: "issue"
        })
        db.collection("books").doc(this.state.scannedBookID).update({
            bookAvailability: false
        })
        db.collection("students").doc(this.state.scannedStudentId).update({
            numberOfBooksIssued: firebase.firestore.FieldValue.increment(1)
        })
        Alert.alert("book issued")
        this.setState({
            scannedBookID: "",
            scannedStudentId: ""
        })
    }
    initiateBookReturn = async() => {
        db.collection("transactions").add({
            studentId: this.state.scannedStudentId,
            bookId: this.state.scannedBookID,
            date: firebase.firestore.Timestamp.now().toDate(),
            transactionType: "return"
        })
        db.collection("books").doc(this.state.scannedBookID).update({
            bookAvailability: true
        })
        db.collection("students").doc(this.state.scannedStudentId).update({
            numberOfBooksIssued: firebase.firestore.FieldValue.increment(-1)
        })
        Alert.alert("book returned")
        this.setState({
            scannedBookID: "",
            scannedStudentId: ""
        })
    }
    render(){
        const{hasCameraPermissions} = this.state
        const{scanned} = this.state
        const{buttonState} = this.state
        if(buttonState != "normal" && hasCameraPermissions){
            return(
                <BarCodeScanner onBarCodeScanned = {scanned?undefined:this.handleBarCodeScanner} style = {StyleSheet.absoluteFillObject}/>
            )
        }else if(buttonState === "normal"){
            return(
                <KeyboardAvoidingView style = {styles.container} behavior = "padding" enabled>
                <View style = {styles.container}>
                    <Image source = {require("../assets/booklogo.jpg")} style = {{width: 200, height: 200}}/>
                    <Text style = {{textAlign: "center", fontSize: 30}}>WIreless LIbrary</Text>
                    <View style = {styles.inputView}>
                        <TextInput onChangeText = {(txt) => {
                            this.setState({
                                scannedBookID: txt
                            })
                        }}   style = {styles.inputBox} placeholder = "Book ID" value = {this.state.scannedBookID}/>
                    <TouchableOpacity onPress = {() => {this.getCameraPermissions("Book_ID")}}>
                        <Text>SCAN</Text></TouchableOpacity></View>
                        <View style = {styles.inputView}>
                        <TextInput onChangeText = {(txt) => {
                            this.setState({
                                scannedStudentId: txt
                            })
                        }} style = {styles.inputBox} placeholder = "Student ID" value = {this.state.scannedStudentId}/>
                    <TouchableOpacity onPress = {() => {this.getCameraPermissions("Student_ID")}}>
                        <Text>SCAN</Text></TouchableOpacity></View>
                        <TouchableOpacity onPress = {async() => {await this.handleTransaction()
                        this.setState({
                            scannedBookID: "",
                            scannedStudentId: ""
                        })
                        }} style = {styles.submitButton}>
                            <Text style = {styles.submitButtonText}>SUBMIT</Text>
                        </TouchableOpacity>
                    </View>
                    </KeyboardAvoidingView>
            )
        }
        
    }
}
const styles = StyleSheet.create({
    submitButton:{ backgroundColor: '#FBC02D', width: 100, height:50 }, 
    submitButtonText:{ padding: 10, textAlign: 'center', fontSize: 20, fontWeight:"bold", color: 'white' },
     container: { flex: 1, justifyContent: 'center', alignItems: 'center' }, 
     displayText:{ fontSize: 15, textDecorationLine: 'underline' }, 
     scanButton:{ backgroundColor: '#2196F3', padding: 10, margin: 10 }, 
     buttonText:{ fontSize: 15, textAlign: 'center', marginTop: 10 }, 
     inputView:{ flexDirection: 'row', margin: 20 }, 
     inputBox:{ width: 200, height: 40, borderWidth: 1.5, borderRightWidth: 0, fontSize: 20 }, 
     scanButton:{ backgroundColor: '#66BB6A', width: 50, borderWidth: 1.5, borderLeftWidth: 0 } 
    });