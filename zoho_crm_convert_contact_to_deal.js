/** 
@summary: Custom functions to convert the contact module record to deals module getRecordById 
@author: Cube Yogi
@created: 20 Dec 2017
**/

/** ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ **/
/** Important Notes : In Zoho CRM Custom Function, 'input' which indicates the input parameters variable, which is configured in custom function by choose the 'Edit Arguements' button
	By Mapping the 'Contact Id' value in parameters in custom function
	1. 'Contact Id' which is unique id of the contact record, it is generated by zoho crm system when the contact record created
	    Using the unique id, get the Contacts record and fetch the contact all field values and process it

**/

/**
	------------------------------------------------------------------------------------------
			CREATE OR INSERT RECORD TO POTENTIAL/DEAL MODULE FROM CONTACT MODULE
	------------------------------------------------------------------------------------------
**/

/**
	~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
	  Step 1 : Get contact records by using the contact unique id value, 
	  For this to use the Zoho CRM Integration Task 'getRecordsById' 
	  Refer https://www.zoho.com/creator/help/script/crm-get-recordbyid.html
	~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
**/

/** Validate the input contact value, which is not null and valid integer value **/
if(input.contact_id != null && input.contact_id > 0)
{
	/** Convert the contact id data type integer  to string value, because the some of the CRM API to support the contact id as string data type **/
	contact_id_str = input.contact_id.toString();
	/** Call the getRecordsById Integration API for get Contacts Module, by pass the contact id as param,
		and get the contact details response **/
	contact_details_response = zoho.crm.getRecordById("Contacts", input.contact_id.toLong());
	/** Form the contact name by using the contact first name and last name, which is separated by space **/
	contact_name = ifnull(contact_details_response.get("First Name"),"")+ " " + ifnull(contact_details_response.get("Last Name"),"");
	/**
		~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		Step 2: Form the deal records data fields values as map using the contact values
				1. Contact name as deal name mapping
				2. Contact owner details as deal owner mapping
				3. Contact's Account Name as deal Account Name mapping
				4. Contact Title, Email, Phone, Mobile as deal Title, Email, Phone, Mobile mapping
				5. Contact Lead Source field as deal Lead Source mapping
				6. Contact Email Opt Out field as deal Email Opt Out mapping
				7. Contact Website field as deal Website mapping
				8. Contact Address field such as street, city, state, zip code, country as
					deak Address field mapping
				9. Contact description field as deal description mapping
		~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
	**/
	/** Intialize the map variable for which to store the fields names and values, which is the key value pair storage data type **/
	deal_record_fields_map=map();
	deal_record_fields_map.put("Potential Name",contact_name);
	deal_record_fields_map.put("SMOWNERID",ifnull(contact_details_response.get("SMOWNERID"),""));
	deal_record_fields_map.put("CONTACTID",input.contact_id);
	deal_record_fields_map.put("Account Name",ifnull(contact_details_response.get("Account Name"),""));
	deal_record_fields_map.put("Title",ifnull(contact_details_response.get("Title"),""));
	deal_record_fields_map.put("Email",ifnull(contact_details_response.get("Email"),""));
	deal_record_fields_map.put("Phone",ifnull(contact_details_response.get("Phone"),""));
	deal_record_fields_map.put("Mobile",ifnull(contact_details_response.get("Mobile"),""));
	deal_record_fields_map.put("Lead Source",ifnull(contact_details_response.get("Lead Source"),""));
	deal_record_fields_map.put("Email Opt Out",ifnull(contact_details_response.get("Email Opt Out"),""));
	deal_record_fields_map.put("Website",ifnull(contact_details_response.get("Website"),""));
	deal_record_fields_map.put("Mailing Street",ifnull(contact_details_response.get("Mailing Street"),""));
	deal_record_fields_map.put("Mailing City",ifnull(contact_details_response.get("Mailing City"),""));
	deal_record_fields_map.put("Mailing State",ifnull(contact_details_response.get("Mailing State"),""));
	deal_record_fields_map.put("Mailing Zip",ifnull(contact_details_response.get("Mailing Zip"),""));
	deal_record_fields_map.put("Mailing Country",ifnull(contact_details_response.get("Mailing Country"),""));
	deal_record_fields_map.put("Description",ifnull(contact_details_response.get("Description"),""));

	/**
		~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		Step 3: Integration API to insert the Deals/Potential record create
				Refer : https://www.zoho.com/creator/help/script/crm-create-record.html
		~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
	**/
	potential_create_rec_response = zoho.crm.create("Potentials", deal_record_fields_map);
	/**
		Validate the Potential/Deal creation response and get the unique CRM id of the module using the key value as 'Id'
	**/
	new_potential_unique_id = potential_create_rec_response.get("Id");
	

	/**
		--------------------------------------------------------------------------------------------
			CREATE TASKS FOR POTENTIAL/DEAL MODULE FROM CONTACT MODULE TASKS
		--------------------------------------------------------------------------------------------
	**/
	/**
		~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		Step 1: Get Task deatils from the Contacts Module
				Refer : https://www.zoho.com/creator/help/script/crm-get-relatedrecords.html
				1. Pass Contact Id value as string which is unique value of the contact module record
		~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~	
	**/
	list_of_task_details = zoho.crm.getRelatedRecords("Tasks","Contacts", contact_id_str);
	/**
		~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		Step 2: Parse and Loop the list of task details, and update the task details as parent module
				as Potential/Deal module, which is basically to convert the contact task details to 
				Potential/Deal module task details
		~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
	**/
	for each task_rec in list_of_task_details
	{
		/**
			Get task unique id value from the key value as 'ACTIVITYID'
		**/
		task_unique_id=task_rec.get("ACTIVITYID");
		/**
			Create the map values for task for which to update the task records fields are stored, which is key, value pair data type
		**/
		task_field_map=map();
		/**
			Form the update fields values to store mapping values
		**/
		task_field_map.put("SEID",new_potential_unique_id);
		task_field_map.put("SEMODULE","Potentials");
		/**
			~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
			Step 3: Update the task details as task unique id and task update records
					Refer : https://www.zoho.com/creator/help/script/crm-update-records.html
					1. task_unique_id, which is task record unique id
					2. task_field_map, which contains the task updated fields key and values
		**/
		update_task_rec_response = zoho.crm.updateRecord("Tasks",task_unique_id,task_field_map);
		info update_task_rec_response;
		info task_field_map;
	}

	/**
		--------------------------------------------------------------------------------------------
			CREATE EVENTS FOR POTENTIAL/DEAL MODULE FROM CONTACT MODULE EVENTS
		--------------------------------------------------------------------------------------------
	**/
	/**
		~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		Step 1: Get Event deatils from the Contacts Module
				Refer : https://www.zoho.com/creator/help/script/crm-get-relatedrecords.html
				1. Pass Contact Id value as string which is unique value of the contact module record
		~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~	
	**/
	list_of_event_details = zoho.crm.getRelatedRecords("Events","Contacts", contact_id_str);
	/**
		~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		Step 2: Parse and Loop the list of event details, and update the event details as parent module
				as Potential/Deal module, which is basically to convert the contact event details to 
				Potential/Deal module event details
		~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
	**/
	for each event_rec in list_of_event_details
	{
		/**
			Get event unique id value from the key value as 'ACTIVITYID'
		**/
		event_unique_id=event_rec.get("ACTIVITYID");
		/**
			Create the map values for event for which to update the event records fields are stored, which is key, value pair data type
		**/
		event_field_map=map();
		/**
			Form the update fields values to store mapping values
		**/
		event_field_map.put("SEID",new_potential_unique_id);
		event_field_map.put("SEMODULE","Potentials");
		/**
			~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
			Step 3: Update the event details as event unique id and event update records
					Refer : https://www.zoho.com/creator/help/script/crm-update-records.html
					1. event_unique_id, which is event record unique id
					2. event_field_map, which contains the event updated fields key and values
		**/
		update_event_rec_response = zoho.crm.updateRecord("Events",event_unique_id,event_field_map);
		info update_event_rec_response;
		info event_field_map;
	}

	/**
		--------------------------------------------------------------------------------------------
			CREATE CALLS FOR POTENTIAL/DEAL MODULE FROM CONTACT MODULE CALLS
		--------------------------------------------------------------------------------------------
	**/
	/**
		~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		Step 1: Get Calls deatils from the Contacts Module
				Refer : https://www.zoho.com/creator/help/script/crm-get-relatedrecords.html
				1. Pass Contact Id value as string which is unique value of the contact module record
		~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~	
	**/

	list_of_calls_details = zoho.crm.getRelatedRecords("Calls","Contacts", contact_id_str);
	/**
		~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		Step 2: Parse and Loop the list of calls details, and update the calls details as parent module
				as Potential/Deal module, which is basically to convert the contact calls details to 
				Potential/Deal module calls details
		~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
	**/
	for each calls_rec in list_of_calls_details
	{
		/**
			Get call unique id value from the key value as 'ACTIVITYID'
		**/
		call_unique_id=calls_rec.get("ACTIVITYID");
		/**
			Create the map values for call for which to update the call records fields are stored, which is key, value pair data type
		**/
		call_field_map=map();
		/**
			Form the update fields values to store mapping values
		**/
		call_field_map.put("SEID",new_potential_unique_id);
		call_field_map.put("SEMODULE","Potentials");
		/**
			~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
			Step 3: Update the call details as call unique id and call update records
					Refer : https://www.zoho.com/creator/help/script/crm-update-records.html
					1. call_unique_id, which is call record unique id
					2. call_field_map, which contains the call updated fields key and values
		**/
		update_call_rec_response = zoho.crm.updateRecord("Calls",call_unique_id,call_field_map);
		info update_call_rec_response;
		info call_field_map;
	}

	/**
		Finally return the response which is success ot failed
	**/
	return true;
}

else{
	return false;
}