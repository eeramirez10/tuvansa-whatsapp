import { Item } from "./quotation"

export interface Customer {
  customer_name: string
  customer_lastname: string
  email: string
  phone: string
  location: string
}

export interface ExtractedData {
  customer_name: string
  customer_lastname: string
  email: string
  phone: string
  location: string
  items: Item[]
  file_key?: string
  company: string
  branch_id?: string
}


export interface UpdatedCustomerData {
  id?: string
  customer_name: string
  customer_lastname: string
  email: string
  phone: string
  location: string
  company: string

}