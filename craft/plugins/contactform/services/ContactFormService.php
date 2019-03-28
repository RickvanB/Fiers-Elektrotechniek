<?php
namespace Craft;

/**
 * Contact Form service
 */
class ContactFormService extends BaseApplicationComponent
{
	/**
	 * Sends an email submitted through a contact form.
	 *
	 * @param ContactFormModel $message
	 * @throws Exception
	 * @return void
	 */
	public function sendMessage(ContactFormModel $message)
	{
		$settings = craft()->plugins->getPlugin('contactform')->getSettings();

		if (!$settings->toEmail)
		{
			throw new Exception('The "To Email" address is not set on the plugin’s settings page.');
		}

		// Grab any "to" emails set in the plugin settings.
		$toEmails = ArrayHelper::stringToArray($settings->toEmail);

		foreach ($toEmails as $toEmail)
		{
			$variables = array();
			$email = new EmailModel();
			$emailSettings = craft()->email->getSettings();

			$email->fromEmail = $emailSettings['emailAddress'];
			$email->replyTo   = $message->fromEmail;
			$email->sender    = $emailSettings['emailAddress'];
			$email->fromName  = $settings->prependSender . ($settings->prependSender && $message->fromName ? ' ' : '') . $message->fromName;
			$email->toEmail   = $toEmail;
			$email->subject   = '{{ emailSubject }}';
			$email->body      = '{{ emailBody }}';

			// Custom email message
			$emailMessage = '

			Een persoon heeft het contactformulier ingevuld op de website.
			<br />
			<br />
			<b>Gegevens:</b>
			<br />Naam: '. $message->fromName  .'
			<br />Email: '. $message->fromEmail .'
			<br />Telefoonnummer: ' . $message->fromPhone . '
			<br />Onderwerp: '. $message->subject.'
			
			<br />
			<br />
			------------------------------------------------------
			<br />
			<br />
			<b>Tekst:</b>
			<br /> ' . $message->message . '

			';

			$variables['emailSubject'] = $settings->prependSubject . ($settings->prependSubject && $message->subject ? ' - ' : '') . $message->subject;
			$variables['emailBody'] = $emailMessage;

			if (!empty($message->htmlMessage))
			{
				// Prevent Twig tags from getting parsed
				// Changed variable
				$email->htmlBody = str_replace(array('{%', '{{', '}}', '%}'), array('&lbrace;%', '&lbrace;&lbrace;', '&rbrace;&rbrace;', '%&rbrace;'), $emailMessage);
			}

			if (!empty($message->attachment))
			{
				foreach ($message->attachment as $attachment)
				{
					if ($attachment)
					{
						$email->addAttachment($attachment->getTempName(), $attachment->getName(), 'base64', $attachment->getType());
					}
				}
			}

			craft()->email->sendEmail($email, $variables);
		}
	}

	/**
	 * Fires an 'onBeforeSend' event.
	 *
	 * @param ContactFormEvent $event
	 */
	public function onBeforeSend(ContactFormEvent $event)
	{
		$this->raiseEvent('onBeforeSend', $event);
	}

	/**
	 * Fires an 'onBeforeMessageCompile' event.
	 *
	 * @param ContactFormMessageEvent $event
	 */
	public function onBeforeMessageCompile(ContactFormMessageEvent $event)
	{
		$this->raiseEvent('onBeforeMessageCompile', $event);
	}
}
