import axios from 'axios';
import {API_URL} from '../../config/config';

const APIClient = axios.create({
    baseURL: API_URL,
    timeout: 10000,
});

export default APIClient;