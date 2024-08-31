import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile, sendPasswordResetEmail } from 'firebase/auth';
import { auth, firestore } from '../firebaseConfig';
import { collection, doc, setDoc, getDoc } from 'firebase/firestore';

const Login = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [company, setCompany] = useState('');
  const [position, setPosition] = useState('');
  const [error, setError] = useState('');
  const [isSignup, setIsSignup] = useState(false);
  const [loading, setLoading] = useState(false);
  const [forgotPassword, setForgotPassword] = useState(false); // State for forgot password mode

  const companies = ['Company A', 'Company B', 'Company C'];
  const positions = ['Developer', 'Designer', 'Manager'];

  const handleLoginOrSignup = async () => {
    setError('');
    setLoading(true);

    if (!email || (!forgotPassword && !password) || (isSignup && (!fullName || !company || !position))) {
      setError('Please fill in all the required fields.');
      setLoading(false);
      return;
    }

    try {
      if (forgotPassword) {
        // Check if the email exists in Firestore
        const userDocRef = doc(firestore, 'users', email);
        const userDoc = await getDoc(userDocRef);
        
        if (!userDoc.exists()) {
          setError('No user found with this email.');
          setLoading(false);
          return;
        }

        // If the email exists, send the password reset email
        await sendPasswordResetEmail(auth, email);
        setError('Password reset email sent!');
        setForgotPassword(false); // Reset to login state after sending the email
      } else if (isSignup) {
        // Sign up the user
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Update user's display name
        await updateProfile(user, { displayName: fullName });

        // Save user information in Firestore
        await setDoc(doc(firestore, 'users', user.uid), {
          fullName,
          email,
          company,
          position,
        });

        onLogin();
      } else {
        // Log in the user
        await signInWithEmailAndPassword(auth, email, password);
        onLogin();
      }
    } catch (error) {
      switch (error.code) {
        case 'auth/invalid-email':
          setError('Invalid email format.');
          break;
        case 'auth/email-already-in-use':
          setError('This email is already in use.');
          break;
        case 'auth/user-not-found':
          setError('No user found with this email.');
          break;
        case 'auth/wrong-password':
          setError('Incorrect password.');
          break;
        case 'auth/user-disabled':
          setError('This account has been disabled.');
          break;
        case 'auth/weak-password':
          setError('Password should be at least 6 characters.');
          break;
        default:
          setError('An unexpected error occurred. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{forgotPassword ? 'Reset Password' : isSignup ? 'Sign Up' : 'Login'}</Text>

      {isSignup && !forgotPassword && (
        <>
          <TextInput
            style={styles.input}
            placeholder="Full Name"
            value={fullName}
            onChangeText={setFullName}
            placeholderTextColor="#9CACBA"
          />
          <Picker
            selectedValue={company}
            style={styles.picker}
            onValueChange={(itemValue) => setCompany(itemValue)}
          >
            <Picker.Item label="Select Company" value="" />
            {companies.map((company) => (
              <Picker.Item key={company} label={company} value={company} />
            ))}
          </Picker>
          <Picker
            selectedValue={position}
            style={styles.picker}
            onValueChange={(itemValue) => setPosition(itemValue)}
          >
            <Picker.Item label="Select Position" value="" />
            {positions.map((position) => (
              <Picker.Item key={position} label={position} value={position} />
            ))}
          </Picker>
        </>
      )}

      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        placeholderTextColor="#9CACBA"
      />

      {!forgotPassword && (
        <TextInput
          style={styles.input}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholderTextColor="#9CACBA"
        />
      )}

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {loading ? (
        <ActivityIndicator size="large" color="#2094F3" />
      ) : (
        <TouchableOpacity style={styles.button} onPress={handleLoginOrSignup}>
          <Text style={styles.buttonText}>
            {forgotPassword ? 'Reset Password' : isSignup ? 'Sign Up' : 'Log In'}
          </Text>
        </TouchableOpacity>
      )}

      {!forgotPassword && (
        <>
          <TouchableOpacity onPress={() => setIsSignup(!isSignup)}>
            <Text style={styles.toggleText}>
              {isSignup ? 'Already have an account? Log in' : "Don't have an account? Sign up"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setForgotPassword(true)}>
            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
          </TouchableOpacity>
        </>
      )}

      {forgotPassword && (
        <TouchableOpacity onPress={() => setForgotPassword(false)}>
          <Text style={styles.toggleText}>Back to Login</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#111518',
  },
  title: {
    fontSize: 24,
    color: 'white',
    marginBottom: 20,
  },
  input: {
    width: '100%',
    backgroundColor: '#1B2227',
    color: 'white',
    padding: 15,
    marginBottom: 10,
    borderRadius: 5,
  },
  picker: {
    width: '100%',
    backgroundColor: '#1B2227',
    color: 'white',
    padding: 10,
    marginBottom: 10,
    borderRadius: 5,
  },
  button: {
    backgroundColor: '#2094F3',
    padding: 15,
    borderRadius: 5,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  error: {
    color: 'red',
    marginBottom: 10,
  },
  toggleText: {
    color: '#2094F3',
    marginTop: 20,
    textDecorationLine: 'underline',
  },
  forgotPasswordText: {
    color: '#2094F3',
    marginTop: 10,
    textDecorationLine: 'underline',
  },
});

export default Login;
